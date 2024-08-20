export const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

export const ACCEPTABLE_AUDIO_TYPES = [
  'audio/',
  'audio/mpeg',
  'audio/m4a',
  'audio/mp3',
  'audio/x-mpeg',
];

export const ACCEPTABLE_VIDEO_TYPES = [
  'video/',
  'video/mp4',
  'video/webm',
  'video/ogg',
];

const mb = 1024 * 1024;

export const mineTypeMap = {
  image: {
    limitSize: 5 * mb,
    limitMessage: 'Image file size should be less than 5 MB',
  },
  audio: {
    limitSize: 20 * mb,
    limitMessage: 'Audio file size should be less than 20 MB',
  },
  video: {
    limitSize: 50 * mb,
    limitMessage: 'Video file size should be less than 50 MB',
  },
  file: {
    limitSize: 10 * mb,
    limitMessage: 'File size should be less than 10 MB',
  },
};
