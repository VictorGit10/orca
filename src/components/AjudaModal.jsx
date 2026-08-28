import { useState, useRef } from 'react';
import { P } from '../palette.js';
import { ISO } from '../utils.js';
import { supabaseReady } from '../lib/supabase.js';

export const REPO_URL = 'https://github.com/VictorGit10/orca';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: P.dim, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: P.card2, color: P.text, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
      <div style={{ fontSize: 13.5, color: P.text, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

// Uma linha da "conta" do saldo livre
function Linha({ op, label, hint, forte }) {
  const cor = op === '+' ? P.gb : op === '−' ? P.rb : P.text;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0' }}>
      <span style={{ width: 12, flexShrink: 0, fontSize: 15, fontWeight: 800, color: cor, lineHeight: 1.35 }}>{op}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: forte ? 800 : 600, color: P.text, lineHeight: 1.35 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: P.dim, lineHeight: 1.4, marginTop: 1 }}>{hint}</div>}
      </div>
    </div>
  );
}

export function AjudaModal({ D, dispatch, onClose }) {
  const fileRef = useRef(null);
  const [confirmImp, setConfirmImp] = useState(null);
  const [erro, setErro] = useState('');

  const exportar = () => {
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orca-backup-${ISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escolherArquivo = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErro('');
    try {
      const data = JSON.parse(await file.text());
      // Validação mínima: precisa parecer um estado do Orça
      if (!Array.isArray(data.txs) || !Array.isArray(data.cats)) {
        setErro('Arquivo não parece um backup do Orça (faltam txs/cats).');
        return;
      }
      setConfirmImp(data);
    } catch {
      setErro('Não consegui ler o arquivo — ele precisa ser um JSON válido.');
    }
  };

  const importar = () => {
    // SNAPSHOT_MONTHLY substitui o estado inteiro e vira o novo baseline,
    // sincronizando a restauração para os outros aparelhos.
    dispatch({ type: 'SNAPSHOT_MONTHLY', payload: confirmImp });
    setConfirmImp(null);
    onClose();
  };

  const btn = { flex: 1, background: P.card, border: `1px solid ${P.bd}`, borderRadius: 12, padding: '12px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: P.text };
  const link = { color: P.bl, fontWeight: 700, textDecoration: 'none' };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: P.bg, borderRadius: '22px 22px 0 0', width: '100%', padding: '8px 20px 32px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 12px' }}>
          <div style={{ width: 36, height: 4, background: P.bd2, borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>Como o Orça funciona</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: P.card2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dim, fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: P.dim, marginBottom: 20 }}>O jeito pensado de usar — simples de propósito.</div>

        {!supabaseReady && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8', marginBottom: 5 }}>Você está numa versão de teste</div>
            <div style={{ fontSize: 12.5, color: P.text, lineHeight: 1.5 }}>
              Pode explorar à vontade: os números começam com dados de exemplo e tudo
              que você fizer fica <strong>só neste navegador</strong> — nada é enviado
              para lugar nenhum. Para usar de verdade, com os seus dados sincronizando
              entre celular e computador, monte a sua cópia seguindo o{' '}
              <a href={REPO_URL} target="_blank" rel="noreferrer" style={link}>guia no GitHub</a>.
            </div>
          </div>
        )}

        <Section title="A conta que o app faz">
          <div style={{ fontSize: 13.5, color: P.text, lineHeight: 1.5, marginBottom: 12 }}>
            Tudo no Orça existe para chegar num número só: <strong>o saldo livre</strong> —
            quanto você realmente pode distribuir este mês.
          </div>
          <div style={{ background: P.card, borderRadius: 14, padding: '12px 16px' }}>
            <Linha op="" label="Saldo real informado" hint="o que você tem hoje na conta, já descontadas as faturas do cartão do mês passado" />
            <Linha op="+" label="Entradas do mês" hint="salário e outras receitas" />
            <Linha op="+" label="Ressarcimentos pendentes" hint="o que ainda vão te devolver" />
            <div style={{ height: 1, background: P.bd, margin: '8px 0' }} />
            <Linha op="−" label="Gastos fixos" hint="aluguel, condomínio, assinaturas" />
            <Linha op="−" label="Reserva de emergência" hint="o que não pode ser tocado" />
            <Linha op="−" label="Parcelas futuras" hint="o que já está comprometido no cartão" />
            <Linha op="−" label="Pote de investimentos" hint="o que já foi separado para investir" />
            <div style={{ height: 1, background: P.bd, margin: '8px 0' }} />
            <Linha op="=" label="SALDO LIVRE" hint="é daqui que você distribui entre as categorias e o investimento" forte />
          </div>
          <div style={{ fontSize: 12.5, color: P.dim, lineHeight: 1.5, marginTop: 12 }}>
            O app zera o saldo em toda virada de mês <strong>de propósito</strong>: ele não
            adivinha quanto sobrou. Uma vez por mês você olha as contas, subtrai as
            faturas e informa o número — é a única tarefa manual, e é ela que mantém
            o resto honesto.
          </div>
        </Section>

        <Section title="O fluxo mensal">
          <Step n={1}><strong>Configure uma vez:</strong> gastos fixos, entradas, metas por categoria e reserva de emergência (abas Saldos e Obrig.).</Step>
          <Step n={2}><strong>Todo dia 1º:</strong> toque em <strong>Calc</strong> ao lado do saldo informado, some o que tem nas contas, subtraia as faturas dos cartões e use o resultado.</Step>
          <Step n={3}><strong>Distribua o saldo livre:</strong> no botão de remanejamento, decida quanto vai para cada categoria e quanto vai para investimento. O app avisa se você passou do que tem.</Step>
          <Step n={4}><strong>Durante o mês:</strong> só registre os gastos (+ na tela Início). Metas e saldo livre se ajustam sozinhos.</Step>
          <Step n={5}><strong>Virada de mês:</strong> automática. O pote de investimentos acumula a meta, ressarcimentos pendentes seguem valendo e a aba <strong>Análise</strong> arquiva o mês para você comparar depois.</Step>
        </Section>

        <Section title="Seus dados são seus">
          <div style={{ fontSize: 13.5, color: P.text, lineHeight: 1.5, marginBottom: 12 }}>
            {supabaseReady
              ? <>Seus eventos sincronizam entre os seus aparelhos pela <strong>sua própria conta Supabase</strong>. Nada passa por servidor de terceiros.</>
              : <>Tudo vive apenas no <strong>localStorage deste navegador</strong> — nada sai do aparelho, e limpar os dados do site apaga tudo. Exporte um backup de vez em quando.</>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportar} style={btn}>↓ Exportar JSON</button>
            <button onClick={() => fileRef.current?.click()} style={btn}>↑ Importar JSON</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={escolherArquivo} style={{ display: 'none' }} />

          {erro && <div style={{ marginTop: 10, fontSize: 12.5, color: P.rb, fontWeight: 600 }}>{erro}</div>}

          {confirmImp && (
            <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, color: P.text, lineHeight: 1.5, marginBottom: 10 }}>
                Isto <strong>substitui todos os dados atuais</strong> pelo backup
                ({confirmImp.txs.length} lançamentos, {confirmImp.cats.length} categorias).
                {supabaseReady && ' Como você usa Supabase, a restauração também vale para os seus outros aparelhos.'} Tem certeza?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={importar} style={{ flex: 1, background: P.rb, border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Substituir tudo</button>
                <button onClick={() => setConfirmImp(null)} style={{ flex: 1, background: P.card, border: `1px solid ${P.bd}`, borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: P.dim }}>Cancelar</button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Ter a sua própria cópia">
          <div style={{ fontSize: 13.5, color: P.text, lineHeight: 1.5, marginBottom: 10 }}>
            O Orça é código aberto e não tem cadastro. Para usar com os seus dados
            sincronizando entre aparelhos, você monta a sua instalação — é de graça
            e leva uns 15 minutos.
          </div>
          <Step n={1}><strong>Banco:</strong> crie uma conta grátis no <strong>supabase.com</strong>, rode o script <em>schema.sql</em> do repositório e copie as suas chaves.</Step>
          <Step n={2}><strong>Site:</strong> rode <em>npm run build</em> e arraste a pasta <em>dist</em> para o <strong>netlify.com</strong> (também grátis). O endereço é seu.</Step>
          <Step n={3}>O passo a passo completo, com os comandos, está no <a href={REPO_URL} target="_blank" rel="noreferrer" style={link}>README do repositório</a>.</Step>
          <Step n={4}><strong>Atalho:</strong> copie o README e cole numa IA (ex.: Claude) pedindo <em>"me ajude a configurar o Orça seguindo este guia"</em> — ela faz tudo com você.</Step>
        </Section>

        <a href={REPO_URL} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: P.card, border: `1px solid ${P.bd}`, borderRadius: 12, padding: 14, textDecoration: 'none', color: P.text, fontWeight: 700, fontSize: 13.5 }}>
          📦 github.com/VictorGit10/orca
        </a>
      </div>
    </div>
  );
}
