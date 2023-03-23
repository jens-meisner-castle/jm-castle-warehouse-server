import fs from "fs";
export const getExtension = (path: string): string => {
  const parts = path.split(".");
  const extension = parts[parts.length - 1];
  return extension;
};

export const getFilename = (path: string): string => {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return name;
};

export const copyFilesFromTo = (
  sourceDir: string,
  targetDir: string
): { success: true; error?: never } | { success: false; error: string } => {
  try {
    fs.cpSync(sourceDir, targetDir, {
      recursive: true,
      errorOnExist: false,
      force: true,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};
