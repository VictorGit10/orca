import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` é a raiz de onde o site será servido.
//   Netlify / domínio próprio ......... padrão '/', não precisa de nada
//   GitHub Pages de projeto ........... BASE_PATH=orca npm run build
//
// Sem isso, no GitHub Pages o site sobe em branco: o HTML procura os assets
// em /assets/... e eles estão em /orca/assets/...
//
// Aceita "orca", "/orca/" e também o valor que o Git Bash no Windows converte
// em "C:/Program Files/Git/orca/" — ficamos só com o último segmento.
function normalizeBase(v) {
  if (!v) return '/'
  const seg = v.split(/[\\/]/).filter(Boolean).pop()
  return seg ? `/${seg}/` : '/'
}

export default defineConfig({
  base: normalizeBase(process.env.BASE_PATH),
  plugins: [react()],
})
