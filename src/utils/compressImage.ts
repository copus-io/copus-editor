// Cap the long edge so the WebP output stays small enough for web display
// regardless of the source resolution. Only ever scales down, never up.
const MAX_EDGE = 2560;
const WEBP_QUALITY = 0.8;

export async function compressImage(imageFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image.'));
            URL.revokeObjectURL(imageUrl);
            return;
          }
          const myImage = new File([blob], 'image.webp', {
            type: blob.type,
          });
          resolve(myImage);
          URL.revokeObjectURL(imageUrl);
        },
        'image/webp',
        WEBP_QUALITY,
      );
    };
    img.onerror = () => {
      reject(new Error('Failed to load image.'));
      URL.revokeObjectURL(imageUrl);
    };
    img.src = imageUrl;
  });
}
