// import { memo, useCallback } from "react";
import Compressor from 'compressorjs';

export const baseURL =
  process.env.NEXT_PUBLIC_API_BASEURL ??
  'https://api.cascad3.com/cascad3-clientv2';

export async function uploadImage(params: FormData) {
  return fetch(`${baseURL}/client/common/uploadImage2S3`, {
    method: 'POST',
    body: params,
  }).then((res) => res.json());
}

const editorUploadFiles = (uploadFiles: File, isImage?: boolean) => {
  return new Promise<any>((resolve, reject) => {
    if (isImage) {
      let img = new Image();
      img.src = URL.createObjectURL(uploadFiles);
      img.onload = () => {
        // 获取原宽高
        new Compressor(uploadFiles, {
          quality: 1, // 压缩质量
          // maxWidth: img.naturalWidth > 800 ? 800 : img.naturalWidth, // 压缩后最大宽度
          // maxHeight: 100, // 压缩后最大高度
          success(result: any) {
            if (result.size < 5 * 1024 * 1024) {
              let file = new File([result], uploadFiles.name, {
                type: uploadFiles.type,
              });
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
              new Compressor(uploadFiles, {
                quality: 0.8, // 压缩质量
                // maxWidth: imgWidth, // 压缩后最大宽度
                // maxHeight: imgHeight, // 压缩后最大高度
                success(result1: any) {
                  let file = new File([result1], uploadFiles.name, {
                    type: uploadFiles.type,
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
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFiles);
    uploadImage(formData)
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        reject(error);
      })
      .finally();

    return;
  });
};
export default editorUploadFiles;
