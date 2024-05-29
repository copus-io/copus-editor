import {compressImage} from './compressImage';

export const baseURL =
  process.env.NEXT_PUBLIC_API_BASEURL ??
  'https://api.cascad3.com/cascad3-clientv2';

export async function uploadImage(params: FormData) {
  return fetch(`${baseURL}/client/common/uploadImage2S3`, {
    method: 'POST',
    body: params,
  }).then((res) => res.json());
}

const editorUploadFiles = (uploadFiles: File, mimeType?: string) => {
  return new Promise<any>((resolve, reject) => {
    if (mimeType === 'image') {
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
