// Run from project root: node scripts/fix-svg.cjs
const fs = require('fs');
let data = fs.readFileSync('public/pwa-icon.svg', 'utf8');
data = data.replace('</path></g>', '</path>');
fs.writeFileSync('public/pwa-icon.svg', data);