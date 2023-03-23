import fs from "fs";
import {
  ApiServiceResponse,
  BadTimeForRequestTryLaterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { DbExportData, SystemBackupResponse } from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { zipExport } from "../../utils/ZipFiles.js";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/export/db/data",
  method: "GET",
  neededRole: "admin",
  name: "Get a complete database export.",
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
        await getCurrentSystem().preExport();
        withDefaultPersistence(res, async (persistence) => {
          const { tables, error, errorCode } =
            await persistence.exportTableData();
          if (
            handleErrorOrUndefinedResult(res, tables, errorCode || "-1", error)
          ) {
            return;
          }
          const exportData: DbExportData = {
            version: { software: persistence.version, db: persistence.version },
            tables,
          };
          const apiResponse: ApiServiceResponse<DbExportData> = {
            response: exportData,
          };
          return res.send(apiResponse);
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      } finally {
        await getCurrentSystem().postExport();
      }
    },
  ],
});

allServices.push({
  url: "/export/system/file",
  method: "GET",
  neededRole: "admin",
  name: "Get a complete system export as file.",
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
        await getCurrentSystem().preExport();
        withDefaultPersistence(res, async (persistence) => {
          const { tables, error, errorCode } =
            await persistence.exportTableData();
          if (
            handleErrorOrUndefinedResult(res, tables, errorCode || "-1", error)
          ) {
            return;
          }
          const exportData: DbExportData = {
            version: { software: persistence.version, db: persistence.version },
            tables,
          };
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
          const zipFilename = `${fileFragment}.zip`;
          const zipPath = `${dbDir}.zip`;
          // be sure that the zip file does not exists
          if (fs.existsSync(zipPath)) {
            fs.rmSync(zipPath);
          }
          const dbFilename = `export-db.json`;
          const dbFullPath = `${dbDir}/${dbFilename}`;
          fs.writeFileSync(dbFullPath, JSON.stringify(exportData), {});
          const success = await zipExport(
            dbDir,
            getCurrentSystem().getImageStorePath(),
            zipPath
          );
          // ohne header kann der Dateiname vom client nicht ermittelt werden
          res.append("Access-Control-Expose-Headers", "Content-Disposition");
          return res.download(zipPath, zipFilename, (error) => {
            if (error) {
              console.log(
                "Catched error when sending download: " + error.toString()
              );
            }
            console.log("cleanup temp files");
            // cleanup
            if (fs.existsSync(zipPath)) {
              fs.rmSync(zipPath);
            }
            if (fs.existsSync(dbDir)) {
              fs.rmSync(dbDir, { recursive: true });
            }
          });
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      } finally {
        await getCurrentSystem().postExport();
      }
    },
  ],
});

allServices.push({
  url: "/export/system/backup",
  method: "GET",
  neededRole: "admin",
  name: "Create a complete system export as file and save it in system backup store.",
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
        await getCurrentSystem().preExport();
        const systemBackupStorePath =
          getCurrentSystem().getSystemBackupStorePath();
        withDefaultPersistence(res, async (persistence) => {
          const { tables, error, errorCode } =
            await persistence.exportTableData();
          if (
            handleErrorOrUndefinedResult(res, tables, errorCode || "-1", error)
          ) {
            return;
          }
          const exportData: DbExportData = {
            version: { software: persistence.version, db: persistence.version },
            tables,
          };
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
          const zipFilename = `${fileFragment}.zip`;
          const zipPath = `${dbDir}.zip`;
          // be sure that the zip file does not exists
          if (fs.existsSync(zipPath)) {
            fs.rmSync(zipPath);
          }
          const dbFilename = `export-db.json`;
          const dbFullPath = `${dbDir}/${dbFilename}`;
          fs.writeFileSync(dbFullPath, JSON.stringify(exportData), {});
          const success = await zipExport(
            dbDir,
            getCurrentSystem().getImageStorePath(),
            zipPath
          );
          const backupFilePath = `${systemBackupStorePath}/${zipFilename}`;
          fs.copyFileSync(zipPath, backupFilePath);
          const { size: sizeInBytes } = fs.statSync(backupFilePath);
          console.log("cleanup temp files");
          // cleanup
          if (fs.existsSync(zipPath)) {
            fs.rmSync(zipPath);
          }
          if (fs.existsSync(dbDir)) {
            fs.rmSync(dbDir, { recursive: true });
          }
          const apiResponse: ApiServiceResponse<SystemBackupResponse> = {
            response: {
              version: {
                software: persistence.version,
                db: persistence.version,
              },
              file: { path: backupFilePath, sizeInBytes },
            },
          };
          return res.send(apiResponse);
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      } finally {
        await getCurrentSystem().postExport();
      }
    },
  ],
});

export const services = allServices;
