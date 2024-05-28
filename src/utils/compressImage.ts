export async function compressImage(imageFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image.'));
          return;
        }
        const myImage = new File([blob], 'image.webp', {
          type: blob.type,
        });
        resolve(myImage);
      }, 'image/webp');
    };
    img.onerror = () => {
      reject(new Error('Failed to load image.'));
    };
    img.src = URL.createObjectURL(imageFile);
  });
}
