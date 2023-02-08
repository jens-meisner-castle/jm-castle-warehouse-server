import {
  ApiServiceResponse,
  CastleConfigErrorCode,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import { executeSetup } from "../../system/setup/ExecuteSetup.mjs";
import { getSystemSetupStatus } from "../../system/setup/Status.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import { handleError, withDefaultPersistence } from "../Utils.mjs";
const allServices: ApiService[] = [];

allServices.push({
  url: "/system/status",
  method: "GET",
  neededRole: "admin",
  name: "Get the system status",
  handler: [
    async (req, res) => {
      try {
        const system = getCurrentSystem();
        if (system) {
          const status = await system.getStatus();
          const apiResponse: ApiServiceResponse<typeof status> = {
            response: status,
          };
          return res.send(apiResponse);
        } else {
          return handleError(
            res,
            CastleConfigErrorCode,
            "No system is currently available."
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});
allServices.push({
  url: "/system/setup-status",
  method: "GET",
  neededRole: "admin",
  name: "Get the system setup status",
  handler: [
    async (req, res) => {
      try {
        withDefaultPersistence(res, async (persistence) => {
          const status = await getSystemSetupStatus(persistence);
          const apiResponse: ApiServiceResponse<typeof status> = {
            response: status,
          };
          return res.send(apiResponse);
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});
allServices.push({
  url: "/system/setup",
  method: "GET",
  neededRole: "admin",
  name: "Do a system setup. This is a no-op if the system is already setup.",
  handler: [
    async (req, res) => {
      try {
        withDefaultPersistence(res, async (persistence) => {
          const setup = await executeSetup(persistence);
          const apiResponse: ApiServiceResponse<typeof setup> = {
            response: setup,
          };
          return res.send(apiResponse);
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});
allServices.push({
  url: "/system/control/restart",
  method: "GET",
  neededRole: "admin",
  name: "Executes a system restart. Current system stops everything and starts a new system based on the current configuration file.",
  handler: [
    async (req, res) => {
      try {
        const system = getCurrentSystem();
        if (system) {
          await system.restart();
          const apiResponse: ApiServiceResponse<{ success: boolean }> = {
            response: { success: true },
          };
          res.send(apiResponse);
        } else {
          handleError(
            res,
            CastleConfigErrorCode,
            "No system is currently available."
          );
        }
      } catch (error) {
        handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
