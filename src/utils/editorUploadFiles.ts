import { compressImage } from './compressImage';

export const baseURL = 'https://api.client.prod.copus.io';

export async function uploadImage(params: FormData) {
  return fetch(`${baseURL}/client/common/uploadImage2S3`, {
    method: 'POST',
    body: params,
  }).then((res) => res.json());
}

const editorUploadFiles = (uploadFiles: File, isImage?: boolean) => {
  return new Promise<any>((resolve, reject) => {
    if (isImage) {
      compressImage(uploadFiles).then((myImage) => {
        const formData = new FormData();
        formData.append('file', myImage);
        uploadImage(formData)
          .then((res) => {
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          })
          .finally();
      });
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
