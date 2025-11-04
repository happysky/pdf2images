import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { createCanvas } from 'canvas';
import pdfjsLib, { pdfjsDocumentOptions, destroyDocument } from '../pdf/pdfjsLib.js';
import { ROOT_PATH } from '../config.js';
const PDF_PAGE_VIEWPORT_SCALE = 2;
export const RENDER_IMG_EXTNAME = 'jpeg';



async function getBase64 () {
  for (const file of files) {
    const fileData = await fs.readFile(path.resolve('pdfs',file));
    const typedFileData = new Uint8Array(fileData);
    const pdfDocument = await pdfjsLib.getDocument({
      data: typedFileData,
      ...pdfjsDocumentOptions,
    }).promise;
    const { numPages } = pdfDocument;

    for(let i=1; i<=numPages; i++){
      const pdfPage = await pdfDocument.getPage(i);
      const viewport = pdfPage.getViewport({
        scale: PDF_PAGE_VIEWPORT_SCALE,
      });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      // 渲染页面
      await pdfPage.render({
        canvasContext: context,
        viewport,
      }).promise;
      // 获取图片
      const imgBufData = canvas.toBuffer(`image/${RENDER_IMG_EXTNAME}`);
      const imgB64Data = imgBufData.toString('base64');
    
      base64Arr.push(imgB64Data);
    }
  }
}
// await getBase64();


const pdf2Image = async (pdfDocument, fileRootDir, pageNum)=>{
  const pdfPage = await pdfDocument.getPage(pageNum);
  const viewport = pdfPage.getViewport({
    scale: PDF_PAGE_VIEWPORT_SCALE,
  });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  // 渲染页面
  await pdfPage.render({
    canvasContext: context,
    viewport,
  }).promise;
  // 获取图片
  const imgBufData = canvas.toBuffer(`image/${RENDER_IMG_EXTNAME}`);
  // const imgB64Data = imgBufData.toString('base64');

  const t1 = Date.now();
  const filePath = path.join(fileRootDir, `${pageNum}.${RENDER_IMG_EXTNAME}`);
  await fs.writeFile(filePath, imgBufData)
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
  const typedFileData = new Uint8Array(req.file.buffer);
  const pdfDocument = await pdfjsLib.getDocument({
    data: typedFileData,
    ...pdfjsDocumentOptions,
  }).promise;
  const { numPages } = pdfDocument;
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
    for(let i=1; i<=numPages; i++){
      const { create_file_used_time } = await pdf2Image(pdfDocument, fileRootDir, i); 
      createFileUseTime += create_file_used_time
    }
  }
  
  const end = Date.now();

  const data = {
      "now": Date.now(),
      "md5": file_md5,
      "page_count": numPages,
      "used_time": end - start,
      page_number: page_number_pdf,
      "create_file_used_time": createFileUseTime
  }

  res.json({
    error: 0,
    data
  })
}

export default convert;