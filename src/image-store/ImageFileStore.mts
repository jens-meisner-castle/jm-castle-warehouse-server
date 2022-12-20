import fs from "fs";
import {
  FilesystemStoreSpec,
  ImageStoreSpec,
} from "jm-castle-warehouse-types/build";
import sharp from "sharp";

export interface ImageDimensions {
  width: number;
  height: number;
}

export class ImageFileStore {
  constructor(spec: FilesystemStoreSpec & ImageStoreSpec) {
    const { maxWidth, maxHeight, path } = spec;
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.path = path.endsWith("/") ? path : `${path}/`;
  }
  private path: string;
  private maxWidth: number;
  private maxHeight: number;

  public save = async (
    sourcePath: string,
    imageId: string
  ): Promise<ImageDimensions & { size: number; error?: string }> => {
    let shouldResize = true;
    try {
      const { width, height } = await this.dimensions(sourcePath);
      if (width <= this.maxWidth && height <= this.maxHeight) {
        shouldResize = false;
      }
    } catch (error) {
      console.error(
        `Catched error when determining dimensions of image: ${error}`
      );
      return {
        width: -1,
        height: -1,
        size: -1,
        error: `Catched error when determining dimensions of image: ${error}`,
      };
    }
    try {
      const sharpInstance = sharp(sourcePath);
      shouldResize &&
        sharpInstance.resize(this.maxWidth, this.maxHeight, { fit: "inside" });
      // size (in bytes) of outputInfo is undefined
      const destinationPath = this.path + imageId;
      const outputInfo = await sharpInstance.toFile(destinationPath);
      const { size } = fs.statSync(destinationPath);
      const { width, height } = outputInfo;
      return { width, height, size };
    } catch (error) {
      console.error(`Catched error when when trying to save image: ${error}`);
      return {
        width: -1,
        height: -1,
        size: -1,
        error: `Catched error when when trying to save image: ${error}`,
      };
    }
  };

  public dimensions = async (sourcePath: string): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      const sharpInstance = sharp(sourcePath);
      sharpInstance.metadata((error, metadata) => {
        if (error) {
          reject(error);
        } else {
          const { width, height } = metadata;
          if (typeof width === "number" && typeof height === "number") {
            resolve({ width, height });
          } else {
            reject(new Error("Width and/or height are undefined."));
          }
        }
      });
    });
  };
}
