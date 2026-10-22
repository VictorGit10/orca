#!/usr/bin/env bash
# Publica só o build (dist/) em apps-victor/orca → https://apps-victor.github.io/orca/
# As variáveis VITE_* vêm do .env.local (lido pelo Vite no build); nunca uma chave secreta.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="/c/Users/amara/orca-publicado"
grep -q '^VITE_SUPABASE_ANON_KEY=sb_publishable_' "$RAIZ/.env.local" || { echo "Chave não é publishable; abortando"; exit 1; }
cd "$RAIZ"
npm test >/dev/null || { echo "Testes falharam; nada publicado"; exit 1; }
BASE_PATH=orca npm run build >/dev/null
[ -d "$DESTINO/.git" ] || { mkdir -p "$DESTINO"; git -C "$DESTINO" init -q -b main; git -C "$DESTINO" remote add origin https://github.com/apps-victor/orca.git; }
find "$DESTINO" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r "$RAIZ/dist/." "$DESTINO/"
touch "$DESTINO/.nojekyll"
cd "$DESTINO"
git add -A
git -c user.name="Victor Amaral" -c user.email="victor.amaral@ufg.br" commit -qm "Publicação $(git -C "$RAIZ" rev-parse --short HEAD)" || echo "Nada mudou"
git push -q -u origin main
echo "Publicado: https://apps-victor.github.io/orca/"
