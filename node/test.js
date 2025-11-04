import fs from 'fs/promises'

console.log('1');
await fs.access('/usr/app/static/pdfs/85940a0d90c9e2bb71b83fea2122da51')
console.log('2');