# Orça

Aplicativo de finanças pessoais em português brasileiro (BRL). Funciona no
navegador, instala como app no celular (PWA) e roda **sem servidor e sem
cadastro** — seus dados ficam no seu aparelho. A sincronização entre
dispositivos é opcional e usa uma conta Supabase **sua**, não do autor.

**▶ [Experimente agora](https://victorgit10.github.io/orca/)** — demo pública,
sem cadastro, com dados de exemplo. Nada do que você fizer nela sai do seu
navegador.

### Duas formas de usar

| | **Testar** | **Usar de verdade** |
| --- | --- | --- |
| Onde | [victorgit10.github.io/orca](https://victorgit10.github.io/orca/) | Sua própria cópia (Netlify, Vercel, onde quiser) |
| Dados | Só no navegador, com dados de exemplo | Seus, sincronizando entre aparelhos |
| Some se… | você limpar os dados do site | nunca — ficam no seu Supabase |
| Precisa de | nada, é só abrir | conta grátis no Supabase + 15 min de setup |

A demo existe para você ver como o app pensa antes de investir tempo nele. Ela
roda **sem Supabase de propósito**: se tivesse credenciais embutidas, qualquer
visitante enxergaria os dados de quem publicou (veja
[Entendendo a segurança](#entendendo-a-segurança-leia-antes-de-publicar)).

Gostou? A seção [Sincronizando entre dispositivos](#sincronizando-entre-dispositivos-supabase)
monta a sua.

---

## A ideia: chegar no saldo livre e distribuir

A maioria dos apps de finanças pede para você categorizar o passado. O Orça faz
o contrário: ele responde **"quanto eu realmente posso gastar este mês?"** e
deixa você decidir para onde esse dinheiro vai.

O caminho é sempre o mesmo:

```
   Saldo real informado        o que você tem hoje na conta, já descontadas
                               as faturas de cartão do mês anterior
 + Entradas do mês             salário e outras receitas
 + Ressarcimentos pendentes    o que vão te devolver
 ─────────────────────────────
 − Gastos fixos                aluguel, condomínio, assinaturas
 − Reserva de emergência       o que não pode ser tocado
 − Parcelas futuras            o que já está comprometido no cartão
 − Pote de investimentos       o que já foi separado para investir
 ─────────────────────────────
 = SALDO LIVRE                 o número que importa
```

O **saldo livre** é o que sobra de verdade. A partir dele você distribui: quanto
vai para cada categoria (Mercado, Transporte, Restaurantes…) e quanto vai para
investimento. O app mostra o tempo todo se essa distribuição cabe no saldo livre
ou se você se comprometeu além do que tem.

Depois é só registrar os gastos. Metas, saldo livre e remanejamento se ajustam
sozinhos.

### Por que o saldo é informado, e não calculado

O app **zera o saldo em toda virada de mês, de propósito**. Ele não tenta
adivinhar quanto sobrou nem conciliar extrato: uma vez por mês você olha suas
contas, subtrai as faturas e diz o número. É a única tarefa manual, e é ela que
mantém o resto honesto. O botão **Calc** ao lado do campo faz a soma
(contas − faturas) para você.

### O fluxo mensal

1. **Uma vez só:** cadastre gastos fixos, entradas, metas por categoria e reserva.
2. **Todo dia 1º:** informe o saldo real (use o **Calc**) e distribua o saldo livre.
3. **Durante o mês:** registre os gastos no botão **+**.
4. **Virada de mês:** automática — o pote de investimentos acumula a meta, os
   ressarcimentos pendentes continuam valendo e o mês fechado é arquivado na
   aba **Análise**.

---

## Funcionalidades

- Cadastro único de despesas fixas, receitas, metas por categoria e reserva
- Saldo informado mensalmente, com **calculadora** integrada (contas − faturas)
- **Remanejamento** do saldo livre entre categorias e investimento
- Rollover mensal automático, com arquivamento do mês fechado
- **Aba Análise:** meta × gasto por categoria, quanto passou de cada meta,
  variação mês a mês, média dos meses fechados e evolução da reserva
- **Exportar / Importar JSON** como backup (botão `?` → *Seus dados são seus*)
- Sincronização opcional entre dispositivos via Supabase, em tempo real
- PWA instalável, funciona offline

---

## Rodando localmente

Requer Node 20+.

```bash
git clone https://github.com/VictorGit10/orca.git
cd orca
npm install
npm run dev
```

Pronto — o app abre já funcionando, com dados de exemplo, sem configurar nada.
Tudo fica no `localStorage` do navegador.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` para conferir antes de publicar |
| `npm run test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npm run backup` | Baixa todos os seus eventos do Supabase para um JSON |

---

## Sincronizando entre dispositivos (Supabase)

Sem isto o app funciona normalmente, só que os dados não saem do aparelho.
Nada neste repositório aponta para o banco do autor: cada pessoa usa o seu.

**1.** Crie uma conta grátis em [supabase.com](https://supabase.com) e um projeto novo.

**2.** No **SQL Editor** do projeto, cole e rode o conteúdo de
[`supabase/schema.sql`](supabase/schema.sql). Isso cria a tabela `events` com
RLS e Realtime ligados. *Rode uma vez só, num projeto novo.*

**3.** Copie as credenciais em **Settings → API**: *Project URL* e a
*publishable key* (ou *anon key*).

**4.** Crie seu `.env.local`:

```bash
cp .env.example .env.local
```

**5.** Preencha as três variáveis. Para o `FAMILY_ID`, gere um valor aleatório:

```bash
node -e "console.log(crypto.randomUUID())"
```

**6.** `npm run dev` — o indicador de sincronização aparece no topo do app.
Abra em outro aparelho com o mesmo `.env.local` e os dois passam a conversar.

### Entendendo a segurança (leia antes de publicar)

Este é o ponto que mais confunde, então vale ser explícito.

**A `anon key` ser pública é normal e esperado.** Ela vai embutida no
JavaScript do site — qualquer pessoa que abra o seu app consegue lê-la, e não há
como evitar isso num app que roda inteiro no navegador. No Supabase, quem
protege os dados não é a chave: é o **RLS** (Row Level Security) da tabela.

**O que realmente separa seus dados é o `family_id`.** O `schema.sql` cria a
tabela com políticas abertas de leitura e escrita — o modelo aqui é
"quem souber o `family_id` entra". Por isso:

- Use um **UUID aleatório**, nunca algo como `familia-silva` ou `nossa-casa-123`.
  Um valor adivinhável é o mesmo que não ter proteção.
- O `family_id` também fica visível no bundle publicado. Ou seja: **quem tem o
  link do seu site tem acesso aos seus dados.** Se você for publicar numa URL
  pública para outras pessoas conhecerem o app, publique *sem* as variáveis
  (modo offline) e mantenha a versão sincronizada em outro endereço, só seu.
- Não existem políticas de `UPDATE` nem de `DELETE`. Com o RLS ligado, isso
  significa que ninguém consegue apagar ou alterar eventos usando a chave
  pública — no pior caso, alguém insere eventos novos.

Quer isolamento de verdade, com login por pessoa? Aí o caminho é trocar as
políticas por `auth.uid()` e ligar o Supabase Auth — fora do escopo deste
repositório, mas a tabela `events` já está pronta para isso.

---

## Publicando

O build é estático: qualquer hospedagem de arquivos serve.

**As variáveis são embutidas no momento do build**, não lidas em tempo de
execução. Então quem builda precisa tê-las — e é justamente por isso que os dois
ambientes deste projeto são separados:

| Ambiente | Build | Variáveis | Para quê |
| --- | --- | --- | --- |
| **GitHub Pages** | GitHub Actions, manual | nenhuma → modo offline | demo pública |
| **Netlify** | sua máquina, `dist/` arrastada | do seu `.env.local` | seu uso diário |

Nunca publique numa URL divulgada um build feito com as suas variáveis: o
`family_id` vai dentro do bundle.

### Netlify (arrastando o `dist/`)

```bash
npm run build
```

O build lê o seu `.env.local` e embute as credenciais. Arraste a pasta `dist/`
para o Netlify e pronto.

### Netlify (conectado ao GitHub)

O build roda nos servidores do Netlify, que **não têm o seu `.env.local`**.
Cadastre as três variáveis em **Site configuration → Environment variables**,
senão o site publica em modo offline. O [`netlify.toml`](netlify.toml) já traz o
comando de build e a pasta de publicação.

### GitHub Pages (a demo)

O Pages serve arquivos estáticos e **não roda `npm run build` sozinho**. O
workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) faz isso —
e roda **só quando acionado à mão**, para que nenhum push publique nada sem
querer:

1. **Settings → Pages → Source:** *GitHub Actions* (uma vez só).
2. **Actions → Deploy no GitHub Pages → Run workflow.**

Ele builda sem as variáveis, ou seja, em modo offline — que é o certo para uma
URL pública.

Para buildar a versão de subpasta na sua máquina, o `base` precisa saber onde o
site vai morar (`usuario.github.io/orca/`):

```bash
BASE_PATH=orca npm run build
```

Sem isso a página sobe em branco: o HTML procura os assets na raiz do domínio e
eles estão numa subpasta.

> No **Git Bash** do Windows, um valor começando com `/` é convertido para um
> caminho do Windows (`/orca/` vira `C:/Program Files/Git/orca/`). Por isso o
> `vite.config.js` usa só o último segmento do valor — `orca`, `/orca/` ou o
> caminho mangled funcionam igual.

---

## Backup

Se você **não** usa Supabase, seus dados existem em um lugar só: o
`localStorage` deste navegador. Limpar os dados do site apaga tudo. Use
`?` → **Exportar JSON** de vez em quando.

Se você **usa** Supabase, a tabela `events` é append-only (nada é apagado ou
sobrescrito), mas ainda assim vale ter uma cópia local:

```bash
npm run backup
```

---

## Documentação

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Local-First, Event Sourcing e snapshots
- [`DESIGN.md`](DESIGN.md) — o design system ("The Financial Editorial")
- [`CLAUDE.md`](CLAUDE.md) — referência técnica detalhada, arquivo por arquivo

## Stack

React 19 · Vite 8 · Supabase (opcional) · Vitest · estilização inline, sem
framework CSS.

## Licença

[MIT](LICENSE).
