import fs from "fs";
import { ApiServiceResponse, UnknownErrorCode } from "jm-castle-types";
import { BadTimeForRequestTryLaterCode } from "jm-castle-types/build";
import { DbExportData, ImportResult } from "jm-castle-warehouse-types";
import multiparty from "multiparty";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { copyFilesFromTo } from "../../utils/File.mjs";
import { extractZipExport } from "../../utils/ZipFiles.js";
import { ApiService } from "../Types.mjs";
import { handleError, withDefaultPersistence } from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/import/system/file",
  method: "POST",
  neededRole: "admin",
  name: "Import a castle-warehouse export file.",
  handler: [
    async (req, res) => {
      try {
        if (getCurrentSystem().isImportInProgress()) {
          return handleError(
            res,
            BadTimeForRequestTryLaterCode,
            "An import is currently running. Try later."
          );
        }
        if (getCurrentSystem().isExportInProgress()) {
          return handleError(
            res,
            BadTimeForRequestTryLaterCode,
            "An export is currently running. Try later."
          );
        }
        await getCurrentSystem().preImport();
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
            const zipOutPath = `${getCurrentSystem().getTempFilePath()}/${zipFile.originalFilename.replace(
              ".zip",
              ""
            )}`;
            console.log(
              "importing:",
              zipFile.path,
              zipFile.originalFilename,
              zipOutPath
            );
            // be sure that the new dir is empty (delete + create)
            if (fs.existsSync(zipOutPath)) {
              fs.rmSync(zipOutPath, { recursive: true });
            }
            fs.mkdirSync(zipOutPath);
            const { success: zipSuccess, error: zipError } =
              await extractZipExport(zipFile.path, zipOutPath);
            if (zipError) {
              return handleError(res, UnknownErrorCode, zipError);
            }
            if (!zipSuccess) {
              return handleError(
                res,
                UnknownErrorCode,
                `Received no error and no success from extractZipExport.`
              );
            }
            const fileContent = fs.readFileSync(
              `${zipOutPath}/database/export-db.json`
            );
            const dbData: DbExportData = JSON.parse(
              fileContent.toString("utf-8")
            );
            const {
              tables,
              error: dbError,
              errorCode: dbErrorCode,
            } = await persistence.importTableData(dbData.tables);
            if (dbError) {
              return handleError(res, dbErrorCode || UnknownErrorCode, dbError);
            }
            if (!tables) {
              return handleError(
                res,
                UnknownErrorCode,
                `Received no error and no table results from importTableData.`
              );
            }
            const { success, error: imagesCopyError } = copyFilesFromTo(
              `${zipOutPath}/images`,
              getCurrentSystem().getImageStorePath()
            );
            if (imagesCopyError) {
              return handleError(
                res,
                dbErrorCode || UnknownErrorCode,
                imagesCopyError
              );
            }
            const response: ImportResult = {
              database: { tables },
              images: { inserted: -1, updated: -1 },
            };
            // cleanup
            if (fs.existsSync(zipFile.path)) {
              fs.rmSync(zipFile.path);
            }
            if (fs.existsSync(zipOutPath)) {
              fs.rmSync(zipOutPath, { recursive: true });
            }
            const apiResponse: ApiServiceResponse<ImportResult> = {
              response,
            };
            await getCurrentSystem().postImport();
            return res.send(apiResponse);
          });
        });
      } catch (error) {
        handleError(res, UnknownErrorCode, error.toString());
        await getCurrentSystem().postImport();
      }
    },
  ],
});

export const services = allServices;
