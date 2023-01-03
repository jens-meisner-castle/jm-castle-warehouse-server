import fs from "fs";
import {
  ApiServiceResponse,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import { DateTime } from "luxon";
import multiparty from "multiparty";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { extractZipExport } from "../../utils/ZipFiles.js";
import { ApiService } from "../Types.mjs";
import { handleError, withDefaultPersistence } from "../Utils.mjs";

const allServices: ApiService[] = [];

interface ImportResult {
  success: boolean;
}

allServices.push({
  url: "/import/db/file",
  method: "POST",
  neededRole: "admin",
  name: "Import a castle-warehouse export file.",
  handler: [
    async (req, res) => {
      try {
        const formData = new multiparty.Form();
        formData.parse(req, async (error, fields, files) => {
          withDefaultPersistence(res, async (persistence) => {
            const zipFile: {
              path: string;
              size: number;
              originalFilename: string;
            } = Array.isArray(files.file) ? files.file[0] : files.file;
            // be sure that temp path exists
            if (!fs.existsSync(getCurrentSystem().getTempFilePath())) {
              fs.mkdirSync(getCurrentSystem().getTempFilePath());
            }
            const fileFragment = `export-${DateTime.now().toFormat(
              "yyyy-LL-dd-HH-mm-ss-SSS"
            )}`;
            const dbDir = `${getCurrentSystem().getTempFilePath()}/${fileFragment}`;
            // be sure that the new dir is empty (delete + create)
            if (fs.existsSync(dbDir)) {
              fs.rmSync(dbDir, { recursive: true });
            }
            fs.mkdirSync(dbDir);
            const { success, error } = await extractZipExport(
              zipFile.path,
              dbDir
            );
            if (error) {
              return handleError(res, UnknownErrorCode, error);
            }
            if (!success) {
              return handleError(
                res,
                UnknownErrorCode,
                `Received no error and no success from extractZipExport.`
              );
            }
            // cleanup
            if (fs.existsSync(zipFile.path)) {
              fs.rmSync(zipFile.path);
            }
            if (fs.existsSync(dbDir)) {
              fs.rmSync(dbDir, { recursive: true });
            }
            const apiResponse: ApiServiceResponse<ImportResult> = {
              response: { success: true },
            };
            return res.send(apiResponse);
          });
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
