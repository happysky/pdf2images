import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFJS_PATH } from './entry.js';
import path from 'path';
//变量存至全局，在提取出去的pdf解析逻辑(pdf-parsing)中使用
global.pdfjsLib = pdfjsLib;
// 设置worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(
  PDFJS_PATH,
  'legacy/build/pdf.worker.mjs',
);
// PDFJS依赖常量、注意结尾的/不能少，pdfjs是纯路径拼接
const CMAP_URL = path.resolve(PDFJS_PATH, 'cmaps') + '/';
const STANDARD_FONT_DATA_URL = path.resolve(PDFJS_PATH, 'standard_fonts') + '/';
export const pdfjsDocumentOptions = {
  cMapUrl: CMAP_URL,
  cMapPacked: true,
  standardFontDataUrl: STANDARD_FONT_DATA_URL,
  verbosity: pdfjsLib.VerbosityLevel.ERRORS //只打印错误信息，不打印warning
};
/**
 *
 * @param {import('pdfjs-dist').PDFDocumentProxy} doc
 * @returns
 */
const CACHE_DATA_KEY = '__CLEANUP__';
export const destroyDocument = async (doc) => {
  if (doc[CACHE_DATA_KEY]) {
    return Promise.resolve();
  } else {
    const defer = {};
    defer.promise = new Promise((resolve, reject) => {
      defer.resolve = resolve;
      defer.reject = reject;
    });
    doc[CACHE_DATA_KEY] = {
      runTimes: 0,
      done: false,
      timer: setInterval(async () => {
        const data = doc[CACHE_DATA_KEY];
        try {
          if (!data.done) {
            await doc.cleanup();
            data.done = true;
          }
        } catch (e) {
          if (data.runTimes > 100) {
            // 执行多次仍然失败
            data.done = true;
          } else {
            data.runTimes++;
          }
        } finally {
          if (data.done) {
            clearInterval(data.timer);
            await doc.destroy();
            defer.resolve();
          }
        }
      }, 50),
    };
    return defer.promise;
  }
};
export default pdfjsLib;
