import archiver from "archiver";
import fs from "fs";
import StreamZip from "node-stream-zip";

export const zipDirectory = async (
  sourceDir: string,
  destinationFile: string
) => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const stream = fs.createWriteStream(destinationFile);
      archive
        .directory(sourceDir, false)
        .on("error", (err) => reject(err))
        .pipe(stream);

      stream.on("close", () => resolve(true));
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

export const zipExport = async (
  dbDir: string,
  imageDir: string,
  destinationFile: string
) => {
  return new Promise<boolean>((resolve, reject) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const stream = fs.createWriteStream(destinationFile);
      archive
        .directory(dbDir, "database")
        .directory(imageDir, "images")
        .on("error", (err) => reject(err))
        .pipe(stream);

      stream.on("close", () => resolve(true));
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

export const extractZipExport = async (
  sourceFile: string,
  destinationDir: string
): Promise<
  | { error?: never; success: true; count: number }
  | { error: string; success: false }
> => {
  let response:
    | { error?: never; success: true; count: number }
    | { error: string; success: false };
  let zip: StreamZip.StreamZipAsync;
  try {
    const zip = new StreamZip.async({ file: sourceFile });
    const entriesCount = await zip.entriesCount;
    const entries = await zip.entries();
    for (const entry of Object.values(entries)) {
      const dirOfEntry = entry.name.includes("/")
        ? `${destinationDir}/${entry.name.slice(
            0,
            entry.name.lastIndexOf("/")
          )}`
        : undefined;
      if (dirOfEntry && !fs.existsSync(dirOfEntry)) {
        fs.mkdirSync(dirOfEntry);
      }
      await zip.extract(entry, dirOfEntry ? dirOfEntry : destinationDir);
    }
    response = { success: true, count: entriesCount };
  } catch (error) {
    response = { success: false, error: error.toString() };
  } finally {
    zip && (await zip.close());
  }
  return response;
};
