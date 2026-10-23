#!/usr/bin/env bash
# Publica só o build (dist/) em orca-victor/orca-victor.github.io → https://orca-victor.github.io/
# e, no endereço antigo (apps-victor.github.io/orca/), um build que envia o que
# estiver pendente e leva ao endereço novo.
# As variáveis VITE_* vêm do .env.local (lido pelo Vite no build); nunca uma chave secreta.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
grep -q '^VITE_SUPABASE_ANON_KEY=sb_publishable_' "$RAIZ/.env.local" || { echo "Chave não é publishable; abortando"; exit 1; }
cd "$RAIZ"
npm test >/dev/null || { echo "Testes falharam; nada publicado"; exit 1; }

publicar() { # $1 = BASE_PATH, $2 = pasta local, $3 = repositório
  local destino="$2"
  BASE_PATH="$1" npm run build >/dev/null
  [ -d "$destino/.git" ] || { mkdir -p "$destino"; git -C "$destino" init -q -b main; git -C "$destino" remote add origin "https://github.com/$3.git"; }
  find "$destino" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  cp -r "$RAIZ/dist/." "$destino/"
  touch "$destino/.nojekyll"
  git -C "$destino" add -A
  git -C "$destino" -c user.name="Victor Amaral" -c user.email="victor.amaral@ufg.br" commit -qm "Publicação $(git -C "$RAIZ" rev-parse --short HEAD)" || echo "Nada mudou em $3"
  git -C "$destino" push -q -u origin main
}

publicar "" /c/Users/amara/orca-site orca-victor/orca-victor.github.io
publicar orca /c/Users/amara/orca-publicado apps-victor/orca
echo "Publicado: https://orca-victor.github.io/ (e aviso em https://apps-victor.github.io/orca/)"
