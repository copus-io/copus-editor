export function compressNumber(num: number): string {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}

export function createUID(): string {
  const randomStr = compressNumber(Math.round(Math.random() * 1e10)).substring(0, 4);
  return randomStr;
}
