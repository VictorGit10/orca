import { nowYM } from './utils.js';

// Dados de demonstração. São FICTÍCIOS de propósito: este arquivo vai para o
// bundle público (a demo do GitHub Pages), então nunca coloque aqui valores,
// nomes de despesa ou metas reais de ninguém.
//
// Servem para que quem abre o app pela primeira vez veja as telas povoadas —
// inclusive a aba Análise, que precisa de meses fechados para mostrar algo. Na
// primeira ação do usuário este estado passa a ser dele.

// Datas relativas ao mês atual, para a demo não envelhecer
const shift = (monthsAgo, day) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-${String(day).padStart(2, '0')}`;
};
const ymAgo = monthsAgo => shift(monthsAgo, 1).slice(0, 7);
const ymAhead = monthsAhead => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const CATS = [
  { id: 1, name: 'Mercado', goal: 900, hue: '#10b981' },
  { id: 2, name: 'Transporte', goal: 300, hue: '#3b82f6' },
  { id: 3, name: 'Restaurantes', goal: 400, hue: '#ec4899' },
  { id: 4, name: 'Casa e outros', goal: 500, hue: '#f59e0b' },
];

// Gastos espalhados pelos últimos meses, para as barras da Análise terem forma
let nextId = 100;
const gasto = (monthsAgo, day, cat, val, note = '') =>
  ({ id: nextId++, dt: shift(monthsAgo, day), cat, val, note });

const txs = [
  // mês atual, em andamento
  gasto(0, 3, 1, 218.4, 'Compra da semana'),
  gasto(0, 5, 2, 24.5),
  gasto(0, 6, 3, 68, 'Almoço'),
  gasto(0, 9, 1, 96.7),
  gasto(0, 11, 4, 130, 'Farmácia'),
  gasto(0, 12, 2, 31.9),
  // mês passado
  gasto(1, 4, 1, 240),
  gasto(1, 8, 3, 112, 'Aniversário'),
  gasto(1, 12, 1, 187.3),
  gasto(1, 15, 2, 88.6),
  gasto(1, 19, 4, 260, 'Presente'),
  gasto(1, 22, 1, 205.9),
  gasto(1, 26, 3, 74),
  // dois meses atrás — mês em que estourou o orçado
  gasto(2, 2, 1, 268),
  gasto(2, 7, 3, 156, 'Jantar fora'),
  gasto(2, 10, 4, 410, 'Conserto da geladeira'),
  gasto(2, 14, 1, 233.5),
  gasto(2, 18, 2, 102.3),
  gasto(2, 23, 1, 279.8),
  gasto(2, 27, 3, 198),
  // três meses atrás
  gasto(3, 5, 1, 212),
  gasto(3, 9, 2, 76.4),
  gasto(3, 13, 3, 89),
  gasto(3, 17, 1, 198.6),
  gasto(3, 21, 4, 145, 'Material de limpeza'),
];

export const SEED = {
  bal: 6800, res: 1500, investAcumulado: 500, investGoal: 300, lastMonth: nowYM(),
  calc: { accts: [], cards: [] },
  cats: CATS,
  txs: txs.reverse(), // mais recentes primeiro, como o app mantém
  inc: [{ id: 1, name: 'Salário', val: 4800, got: true }],
  fix: [
    { id: 1, name: 'Aluguel', val: 1500 },
    { id: 2, name: 'Internet', val: 100 },
    { id: 3, name: 'Energia', val: 180 },
    { id: 4, name: 'Celular', val: 60 },
    { id: 5, name: 'Streaming', val: 40 },
  ],
  inst: [
    { id: 1, name: 'Notebook', pm: 150, end: ymAhead(3) },
    { id: 2, name: 'Bicicleta', pm: 80, end: ymAhead(1) },
  ],
  recv: [
    { id: 1, name: 'Reembolso do plano', val: 180, got: false, dt: shift(1, 20) },
  ],
  // Histórico dos meses fechados: sem isto a aba Análise abre vazia e a demo
  // não mostra justamente o que ela faz de mais interessante.
  hist: [
    { m: ymAgo(3), cats: { 1: 900, 2: 300, 3: 380, 4: 500 }, res: 1400, bal: 6300, inv: 200 },
    { m: ymAgo(2), cats: { 1: 900, 2: 300, 3: 380, 4: 500 }, res: 1250, bal: 6550, inv: 400 },
    { m: ymAgo(1), cats: { 1: 900, 2: 300, 3: 400, 4: 500 }, res: 1400, bal: 6420, inv: 600 },
  ],
};
