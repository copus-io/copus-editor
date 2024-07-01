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

export const mineTypeMap = {
  image: {
    limitSize: 5e6,
    limitMessage: 'Image file size should be less than 5 MB',
  },
  audio: {
    limitSize: 1e7,
    limitMessage: 'Audio file size should be less than 10 MB',
  },
  video: {
    limitSize: 2e7,
    limitMessage: 'Video file size should be less than 20 MB',
  },
  file: {
    limitSize: 1e7,
    limitMessage: 'File size should be less than 10 MB',
  },
};
