export const decodeBase64Json = (base64String) => {
  const sanitized = String(base64String || '').replace(/\s/g, '');
  const binaryString = atob(sanitized);
  const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  const decodedText = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(decodedText);
};