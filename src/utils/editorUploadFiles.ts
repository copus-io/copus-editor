// import { memo, useCallback } from "react";
import Compressor from 'compressorjs';

export async function uploadImage(params: FormData) {}

const EditorUploadFiles = (files: any, isImage?: boolean) => {
  return new Promise<any>((resolve, reject) => {
    if (!isImage) {
      // let file = new File([files, files.name, { type: files.type });
      // console.log('result', result, files, file);
      const formData = new FormData();
      formData.append('file', files);
      uploadImage(formData)
        .then((res) => {
          resolve(res);
        })
        .catch((error) => {
          reject(error);
        })
        .finally();

      return;
    }
    let img = new Image();
    img.src = URL.createObjectURL(files);
    img.onload = () => {
      // 获取原宽高
      new Compressor(files, {
        quality: 1, // 压缩质量
        // maxWidth: img.naturalWidth > 800 ? 800 : img.naturalWidth, // 压缩后最大宽度
        // maxHeight: 100, // 压缩后最大高度
        success(result: any) {
          if (result.size < 5 * 1024 * 1024) {
            let file = new File([result], files.name, {type: files.type});
            // console.log('result', result, files, file);
            const formData = new FormData();
            formData.append('file', file);
            uploadImage(formData)
              .then((res) => {
                resolve(res);
              })
              .catch((error) => {
                reject(error);
              })
              .finally();
          } else {
            new Compressor(files, {
              quality: 0.8, // 压缩质量
              // maxWidth: imgWidth, // 压缩后最大宽度
              // maxHeight: imgHeight, // 压缩后最大高度
              success(result1: any) {
                let file = new File([result1], files.name, {
                  type: files.type,
                });

                console.log('result1', result1, file);
                const formData = new FormData();
                formData.append('file', file);
                uploadImage(formData)
                  .then((res) => {
                    resolve(res);
                  })
                  .catch((error) => {
                    reject(error);
                  })
                  .finally();
              },
              error(err: any) {
                console.log('error', err);

                reject(err);
              },
            });
          }
        },
      });
    };
  });
};
export default EditorUploadFiles;
