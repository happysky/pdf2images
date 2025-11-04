import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { ROOT_PATH } from '../config.js';
import * as mupdf from "mupdf"
import { Piscina } from 'piscina';
const PDF_PAGE_VIEWPORT_SCALE = 2;
export const RENDER_IMG_EXTNAME = 'jpeg';

export const PDF_PARSE_PARALLEL_MAX_WORKERS = os.cpus().length;
const piscina = new Piscina({
  // ESM 方式引入woker文件地址
  filename: new URL('../pdf/pdf2Image.js', import.meta.url).href,
  // 禁用atomics
  useAtomics: false,
  // 最少woker数
  minThreads: PDF_PARSE_PARALLEL_MAX_WORKERS,
  // 设置5秒内如果没有新任务进来则关闭woker
  idleTimeout: 5000,
});

export const genSharedUint8Array = (uint8arr) => {
  const len = uint8arr.length;
  const sab = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * len);
  const sabArr = new Uint8Array(sab);
  for (let i = 0; i < len; i++) {
    sabArr[i] = uint8arr[i];
  }
  return sabArr;
};



const pdf2Image = async (pdfDocument, fileRootDir, pageNum)=>{
  const t1 = Date.now();
  const page = pdfDocument.loadPage(pageNum-1)
  const pixmap = page.toPixmap(mupdf.Matrix.scale(PDF_PAGE_VIEWPORT_SCALE, PDF_PAGE_VIEWPORT_SCALE), mupdf.ColorSpace.DeviceRGB, false, true)
  const filePath = path.join(fileRootDir, `${pageNum}.${RENDER_IMG_EXTNAME}`);
  const imageBuffer = pixmap.asJPEG(80);
  await fs.writeFile(filePath, imageBuffer)
  const t2 = Date.now();

  return {
    create_file_used_time: t2-t1
  }
}


const convert = async (req, res)=>{
  const { body } = req;
  const page_number = parseInt(body.page_number)
  let page_number_pdf = -1
  const md5 = crypto.createHash('md5');
  const file_md5 = md5.update(req.file.buffer).digest('hex');
  const fileData = req.file.buffer;
  const typedFileData = new Uint8Array(fileData);
  const pdfDocument = mupdf.Document.openDocument(typedFileData, "application/pdf")
  const sabFileData = genSharedUint8Array(fileData);
  const numPages = pdfDocument.countPages()
  if(page_number > 0 && page_number <= numPages){
    page_number_pdf = page_number;
  }


  const fileRootDir = path.join(ROOT_PATH, `static/pdfs/${file_md5}`)

  const start = Date.now();
  let createFileUseTime = 0;

  try{
    await fs.access(fileRootDir)
  }catch(e){
    await fs.mkdir(fileRootDir, { recursive: true });
  }

  if(page_number_pdf >=1){
    await pdf2Image(pdfDocument, fileRootDir, page_number_pdf); 
  }else{
    const tasks = [];
    for(let i=1; i<=numPages; i++){
      const task = piscina.run(
        {
          fileData: sabFileData,
          fileRootDir,
          pageNum: i
        });
      tasks.push(task);
    }
    await Promise.all(tasks);
  }

  const end = Date.now();

  
  
  

  res.json({
    error: 1,
    data: {
      "now": Date.now(),
      "md5": file_md5,
      "page_count": numPages,
      "used_time": end - start,
      page_number: page_number_pdf,
    }
  })
}

export default convert;