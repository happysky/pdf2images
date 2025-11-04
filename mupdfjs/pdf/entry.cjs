const path = require('path');
// 设置根路径
exports.ROOT_PATH = __dirname;
const PDFJS_PATH = path.resolve(require.resolve('pdfjs-dist'), '../..');
console.log('PDFJS_PATH', PDFJS_PATH);
