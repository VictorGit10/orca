// Run from project root: node scripts/build-icons.js
import sharp from 'sharp';
import fs from 'fs';
sharp('public/pwa-icon.svg').resize(192, 192).toFile('public/pwa-icon-192.png');
sharp('public/pwa-icon.svg').resize(512, 512).toFile('public/pwa-icon-512.png');