


https://www.npmjs.com/package/@langchain/classic
npm install @langchain/classic @langchain/core



FOR EXTRACTING TABLE

pdf-table-extractor
npm install pdf-image-extractor


const { ExtractImages } = require("pdf-image-extractor");

const pdfSource = "path/to/your/document.pdf"; // This can be a URL or a Blob
const fileType = "url"; // or 'blob' based on your input type

ExtractImages({ pdf: pdfSource, fileType: fileType }).then((images) => {
  images.forEach((image) => {
    console.log(image.url); // Blob URL for the image
    // You can use the blob URL to display the image or download it
  });
});








import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

async function extractImages(pdfPath) {
  const loadingTask = pdfjsLib.getDocument(pdfPath);
  const pdf = await loadingTask.promise;

  const images = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];

      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintJpegXObject
      ) {
        const objName = ops.argsArray[i][0];
        const xObject = await page.objs.get(objName);

        if (xObject && xObject.data) {
          images.push({
            page: pageNum,
            width: xObject.width,
            height: xObject.height,
            data: xObject.data, // Uint8ClampedArray RGBA values
          });
        }
      }
    }
  }

  return images;
}

extractImages("/mnt/data/file-3.pdf").then((images) => {
  console.log("Extracted images:", images);
});




GREAT FOR EXTRACTING IMAGE:https://www.npmjs.com/package/pdfjs-dist








npm uninstall react-quill
npm install react-quill@2.0.0-beta.4
