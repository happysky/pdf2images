import path from 'path'
import fs from 'fs/promises'
import * as mupdf from "mupdf"
const PDF_PAGE_VIEWPORT_SCALE = 2;
export const RENDER_IMG_EXTNAME = 'jpeg';

export default async ({
  fileData,
  fileRootDir,
  pageNum
})=>{
  console.log('worker-start', pageNum);
  const typedFileData = new Uint8Array(fileData);
  console.log('worker1');
  const pdfDocument = mupdf.Document.openDocument(typedFileData, "application/pdf")
  console.log('worker2');
  const t1 = Date.now();
  const page = pdfDocument.loadPage(pageNum-1)
  console.log('worker3');
  const pixmap = page.toPixmap(mupdf.Matrix.scale(PDF_PAGE_VIEWPORT_SCALE, PDF_PAGE_VIEWPORT_SCALE), mupdf.ColorSpace.DeviceRGB, false, true)
  console.log('worker4');
  const filePath = path.join(fileRootDir, `${pageNum}.${RENDER_IMG_EXTNAME}`);
  console.log('worker5');
  const imageBuffer = pixmap.asJPEG(80);
  console.log('worker6');
  await fs.writeFile(filePath, imageBuffer)
  console.log('worker7');
  const t2 = Date.now();
  console.log('worker-end', pageNum);

  return {
    create_file_used_time: t2-t1
  }
}