function mimeTypeFromUri(uri: string) {
  const extension = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";
  return "image/jpeg";
}

export async function readImageData(uri: string) {
  if (!/^(file|content|https?):/i.test(uri)) {
    throw new Error("Selected image has an invalid local path.");
  }

  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the selected meal photo.");

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return {
    base64: btoa(binary),
    mimeType: mimeTypeFromUri(uri),
  };
}

export function imageMimeType(uri: string) {
  return mimeTypeFromUri(uri);
}
