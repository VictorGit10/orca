# Arquitetura do Sistema: Orça

Este documento define as premissas fundamentais da arquitetura **Local-First** do
aplicativo. Qualquer modificação no código deve respeitar rigorosamente estes
pilares.

---

## 🏛️ Paradigma Principal

**Local-First + Event Sourcing + Snapshots Mensais**

Em vez de um CRUD tradicional que edita linhas em tabelas diversas, o sistema
funciona como um log de eventos sincronizado.

### 1. Local-First Otimista

Toda ação do usuário dispara um `dispatch` que:

- Atualiza o estado na memória (`React state`) instantaneamente.
- Salva o estado consolidado no `localStorage` (`STORAGE_KEY`).
- A interface **nunca** espera uma resposta do servidor para confirmar uma ação.

### 2. Event Sourcing (Tabela Append-Only)

- Não salvamos "o saldo" no Supabase. Salvamos a **mudança**.
- Todas as alterações são enviadas como eventos para uma tabela única chamada
  `events`.
- Colunas principais: `event_type`, `payload` (JSONB), `device_ts` (timestamp do
  clique), `client_id` (aparelho) e `family_id` (grupo).
- A tabela só recebe `INSERT`. Não há `UPDATE` nem `DELETE` — nem no código, nem
  nas políticas de RLS. Apagar um gasto é inserir um evento `DEL_TX`.

### 3. Sincronização e Fila Offline

- Alterações são armazenadas em uma fila local (`QUEUE_KEY` no localStorage).
- O `triggerSync` tenta despejar essa fila no Supabase em segundo plano.
- **Regra de UI:** o estado exibido é sempre a soma do que veio do servidor + o
  que ainda está na fila local esperando envio.
- No `catchUp`, a fila local é aplicada **por último**, para que ações ainda não
  sincronizadas (um `DEL_TX`, por exemplo) não sejam desfeitas pelo servidor.

### 4. Snapshots Mensais (Performance)

- Para evitar o reprocessamento de milhares de eventos antigos, usamos a virada
  de mês (`applyRollover`).
- O rollover gera um evento especial do tipo `SNAPSHOT_MONTHLY`, cujo payload é
  o estado inteiro.
- O app carrega o snapshot escolhido como baseline e aplica apenas os eventos
  que ocorreram **depois** dele.

> ⚠️ **Semântica do snapshot — a pegadinha central desta arquitetura.**
> O `SNAPSHOT_MONTHLY` é gravado *depois* do rollover. Ou seja, seu payload já é
> o estado do mês **novo**: `payload.lastMonth` é o mês que está começando e
> `payload.bal` já foi zerado. As metas e a reserva dentro dele, porém, são as
> que vigoravam no mês que **acabou de fechar**.
>
> Por isso `histFromSnaps` rotula cada snapshot com `prevYM(payload.lastMonth)`.
> Confundir os dois desloca todo o histórico em um mês.

- **Escolha do baseline (`pickBaseline`):** normalmente é o snapshot mais
  recente. Mas um aparelho que gravou um snapshot antes de terminar o catch-up
  produz um baseline incompleto, que "congela" o app num passado errado. Por
  isso um candidato é rejeitado quando um snapshot mais antigo tem mais que o
  dobro das transações dele.

### 5. Histórico Mensal (`D.hist`)

- `D.hist` guarda um registro por mês fechado:
  `{ m: 'YYYY-MM', cats: { catId: goal }, res, bal, inv }`.
- Existe porque **metas e reserva do passado não são reconstruíveis**: o log
  guarda a última alteração de cada uma, não o valor vigente em cada mês.
- O gasto por mês nunca entra no `hist` — ele é sempre recalculado a partir de
  `D.txs`, que nunca é podado.
- Snapshots da v1.2+ já carregam `hist` dentro do payload; os anteriores são
  reconstruídos pelo `histFromSnaps`.

### 6. Multi-Usuário (Realtime)

- O app assina o canal de broadcast do Supabase via WebSocket.
- Eventos criados por outro dispositivo (`client_id` diferente) são aplicados ao
  estado local imediatamente.

### 7. Modelo de Segurança

- A `anon key` é pública por design e fica visível no bundle. Quem protege a
  tabela é o RLS.
- As políticas do `schema.sql` liberam `SELECT` e `INSERT` para qualquer
  portador da chave. **O isolamento real é o `family_id`** — que precisa ser um
  UUID aleatório e ser tratado como senha.
- Consequência prática: quem tem o link de um site publicado *com* as variáveis
  tem acesso aos dados daquele `family_id`.

---

## 🗺️ Onde fica o quê

| Arquivo | Responsabilidade |
| --- | --- |
| `src/store/reducer.js` | `reduceD` (o reducer), `applyRollover` e as chaves de storage |
| `src/hooks/useAppData.js` | Estado, sync, fila, catch-up e realtime |
| `src/lib/supabase.js` | Cliente Supabase e a flag `supabaseReady` |
| `src/utils.js` | Funções puras de cálculo e de histórico |
| `src/components/` | UI (uma aba por arquivo, mais os modais) |

---

## 🚨 Regra de Ouro para Desenvolvimento

> **Nunca altere o banco de dados diretamente.**
> Qualquer mudança de estado deve ser implementada como um novo `case` no
> reducer (`src/store/reducer.js`), garantindo que a ação gere um evento
> rastreável que possa ser replicado em outros dispositivos.

Corolários:

- Nunca remova nem mude o significado de um `event_type` existente. O log tem
  eventos de meses atrás que ainda serão reproduzidos — mudanças precisam ser
  **aditivas**. O `default: return prev` garante que uma versão antiga do app
  ignore eventos que ainda não conhece em vez de quebrar.
- Toda lógica de cálculo mora em `src/utils.js`, como função pura e testável
  sem React.
