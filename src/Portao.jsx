import { useEffect, useState } from 'react';
import App from './App.jsx';
import { P } from './palette.js';
import { supabase, supabaseReady } from './lib/supabase.js';
import { QUEUE_KEY } from './store/reducer.js';

// Portão do app: só mostra o Orça para quem entrou com e-mail + código e tem
// acesso à família. Endereços antigos (Netlify) enviam o que falta e mandam
// para o endereço novo.
const NOVO_ENDERECO = 'https://apps-victor.github.io/orca/';
const HOSTS_ATUAIS = ['apps-victor.github.io', 'localhost', '127.0.0.1'];
const CHAVE_EMAIL = 'orca.email';

const caixa = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bg, padding: 24, fontFamily: 'Manrope, system-ui, sans-serif', color: P.text };
const cartao = { width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 };
const entrada = { padding: '14px 16px', fontSize: 17, borderRadius: 12, border: `1px solid ${P.bd2}`, background: P.card, color: P.text, outline: 'none', fontFamily: 'inherit' };
const botao = { padding: '14px 16px', fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', background: P.gb, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' };
const discreto = { background: 'none', border: 'none', color: P.dim, fontSize: 14, padding: 6, cursor: 'pointer', fontFamily: 'inherit' };
const marca = { fontSize: 28, fontWeight: 800, margin: '0 0 8px' };

function mensagemErro(e) {
  const cod = e?.code || '';
  const status = e?.status;
  if (cod === 'over_email_send_rate_limit' || status === 429) {
    return 'Muitos e-mails em pouco tempo. Use o código do último e-mail ("Já tenho um código") ou espere um pouco.';
  }
  if (cod === 'otp_expired') return 'Código não confere. Use o do e-mail mais recente, ou toque no link dentro dele.';
  if (cod === 'otp_disabled' || cod === 'signup_disabled' || cod === 'user_not_found') return 'Este e-mail não tem acesso ao Orça.';
  if (!navigator.onLine) return 'Sem internet. Tente de novo quando conectar.';
  return 'Não deu certo. Tente de novo.';
}

function lerEmail() {
  try { return localStorage.getItem(CHAVE_EMAIL) || ''; } catch { return ''; }
}

function Entrar() {
  const [email, setEmail] = useState(lerEmail);
  const [etapa, setEtapa] = useState('email');
  const [codigo, setCodigo] = useState('');
  const [status, setStatus] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (ev) => {
    ev.preventDefault();
    const alvo = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(alvo)) { setStatus('Digite um e-mail válido.'); return; }
    setOcupado(true); setStatus('Enviando…');
    const { error } = await supabase.auth.signInWithOtp({
      email: alvo,
      options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
    });
    setOcupado(false);
    if (error) { setStatus(mensagemErro(error)); return; }
    try { localStorage.setItem(CHAVE_EMAIL, alvo); } catch { /* sem armazenamento */ }
    setEtapa('codigo');
    setStatus(`Enviamos um código para ${alvo}. Digite o código ou toque no link do e-mail.`);
  };

  const confirmar = async (ev) => {
    ev.preventDefault();
    const token = codigo.replace(/\s+/g, '');
    if (!/^\d{6,10}$/.test(token)) { setStatus('Digite o código que chegou no e-mail.'); return; }
    setOcupado(true); setStatus('Entrando…');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
    setOcupado(false);
    if (error) { setCodigo(''); setStatus(mensagemErro(error)); return; }
    try { localStorage.setItem(CHAVE_EMAIL, email.trim().toLowerCase()); } catch { /* sem armazenamento */ }
  };

  return (
    <div style={caixa}>
      {etapa === 'email' ? (
        <form style={cartao} onSubmit={enviar}>
          <h1 style={marca}>Orça</h1>
          <label htmlFor="orca-email" style={{ color: P.dim, fontSize: 14 }}>Seu e-mail</label>
          <input id="orca-email" style={entrada} type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <button style={botao} type="submit" disabled={ocupado}>Enviar código</button>
          <button style={discreto} type="button" onClick={() => { setEtapa('codigo'); setStatus(''); }}>Já tenho um código</button>
          <p role="status" style={{ color: P.dim, fontSize: 14, minHeight: 20 }}>{status}</p>
        </form>
      ) : (
        <form style={cartao} onSubmit={confirmar}>
          <h1 style={marca}>Orça</h1>
          <label htmlFor="orca-codigo" style={{ color: P.dim, fontSize: 14 }}>Código do e-mail ({email})</label>
          <input id="orca-codigo" style={{ ...entrada, fontSize: 22, letterSpacing: 4, textAlign: 'center' }} inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={codigo} onChange={e => setCodigo(e.target.value)} autoFocus />
          <button style={botao} type="submit" disabled={ocupado}>Entrar</button>
          <button style={discreto} type="button" onClick={() => { setEtapa('email'); setStatus(''); setCodigo(''); }}>Trocar e-mail / reenviar</button>
          <p role="status" style={{ color: P.dim, fontSize: 14, minHeight: 20 }}>{status}</p>
        </form>
      )}
    </div>
  );
}

function SemAcesso({ email }) {
  return (
    <div style={caixa}>
      <div style={cartao}>
        <h1 style={marca}>Orça</h1>
        <p>Esta conta não tem acesso.</p>
        <p style={{ color: P.dim }}>{email}</p>
        <button style={botao} type="button" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </div>
  );
}

// Endereço antigo: envia a fila de lançamentos ainda não sincronizados e só
// então leva ao endereço novo, para nada se perder na mudança.
function Mudou() {
  const [pendentes, setPendentes] = useState(null);

  useEffect(() => {
    (async () => {
      let q = [];
      try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { q = []; }
      if (q.length > 0) {
        const { error } = await supabase.from('events').insert(q);
        if (!error || error.code === '23505') {
          localStorage.setItem(QUEUE_KEY, '[]');
          q = [];
        }
      }
      setPendentes(q.length);
      if (q.length === 0) setTimeout(() => location.replace(NOVO_ENDERECO), 2500);
    })();
  }, []);

  return (
    <div style={caixa}>
      <div style={cartao}>
        <h1 style={marca}>O Orça mudou de endereço</h1>
        <p>Agora ele fica em <strong>{NOVO_ENDERECO}</strong>. Os seus dados vão junto.</p>
        <p style={{ color: P.dim }}>Se o Orça estava instalado no celular, instale de novo pelo endereço novo e apague este.</p>
        {pendentes === null && <p style={{ color: P.dim }}>Enviando os últimos lançamentos…</p>}
        {pendentes > 0 && <p style={{ color: P.rb }}>{pendentes} lançamento(s) deste aparelho não foram enviados. Não apague este app ainda: avise o Victor.</p>}
        <a style={{ ...botao, textAlign: 'center', textDecoration: 'none' }} href={NOVO_ENDERECO}>Abrir o Orça novo</a>
      </div>
    </div>
  );
}

export default function Portao() {
  const enderecoAntigo = supabaseReady && typeof location !== 'undefined' && !HOSTS_ATUAIS.includes(location.hostname);
  const [estado, setEstado] = useState({ fase: 'carregando', email: '' });

  useEffect(() => {
    if (!supabaseReady || enderecoAntigo) return;
    let vivo = true;

    const avaliar = async (sessao) => {
      if (!sessao) { if (vivo) setEstado({ fase: 'entrar', email: '' }); return; }
      const email = sessao.user?.email || '';
      const { data, error } = await supabase.rpc('orca_sou_membro');
      if (!vivo) return;
      // Sem internet ou função ainda não criada: segue com os dados do aparelho.
      if (error) { setEstado({ fase: 'ok', email }); return; }
      setEstado({ fase: data ? 'ok' : 'sem-acesso', email });
    };

    supabase.auth.getSession().then(({ data }) => avaliar(data.session));
    const { data: inscricao } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') setTimeout(() => avaliar(sessao), 0);
    });
    return () => { vivo = false; inscricao.subscription.unsubscribe(); };
  }, [enderecoAntigo]);

  if (!supabaseReady) return <App />;
  if (enderecoAntigo) return <Mudou />;
  if (estado.fase === 'carregando') return <div style={caixa} />;
  if (estado.fase === 'entrar') return <Entrar />;
  if (estado.fase === 'sem-acesso') return <SemAcesso email={estado.email} />;
  return <App />;
}
