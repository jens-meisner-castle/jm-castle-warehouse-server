import sharp from "sharp";

export const test = async (path: string) => {
  const width = 400;
  const height = 400;
  const currentFileParts = path.split("/");
  const nameAndExtension =
    currentFileParts[currentFileParts.length - 1].split(".");
  const extension = nameAndExtension[nameAndExtension.length - 1];
  const currentName = nameAndExtension
    .slice(0, nameAndExtension.length - 1)
    .join("");
  const newFileParts = currentFileParts.slice(0, currentFileParts.length - 1);
  newFileParts.push(`${currentName}-${width}-${height}.${extension}`);
  const newPath = newFileParts.join("/");
  const outputInfo = await resizeAndSave(path, width, height, newPath);
  return outputInfo;
};

export const resizeAndSave = async (
  sourcePath: string,
  maxWidth: number,
  maxHeight: number,
  destinationPath: string
) => {
  const sharpInstance = sharp(sourcePath);
  sharpInstance.resize(maxWidth, maxHeight, { fit: "inside" });
  const outputInfo = await sharpInstance.toFile(destinationPath);
  return outputInfo;
};
