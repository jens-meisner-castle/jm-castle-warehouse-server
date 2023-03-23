import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_Emission } from "jm-castle-warehouse-types/build";
import { getQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/emission/select/interval",
  method: "GET",
  neededRole: "internal",
  parameters: getQueryParametersSchema(
    ["at_from", "integer", true, "Interval start (in seconds)"],
    ["at_to", "integer", true, "Interval end (in seconds)"]
  ),
  name: "Select rows by interval.",
  handler: [
    async (req, res) => {
      try {
        const { at_from = undefined, at_to = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (at_from && at_to) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.emission.select({
              at_from,
              at_to,
            });
            const { result, error, errorCode, errorDetails } = response || {};
            if (
              handleErrorOrUndefinedResult(
                res,
                result,
                errorCode || "-1",
                error,
                errorDetails
              )
            ) {
              return;
            }
            const apiResponse: ApiServiceResponse<{ result: typeof result }> = {
              response: { result },
            };
            return res.send(apiResponse);
          });
        } else {
          return handleError(
            res,
            BadRequestMissingParameterCode,
            "This url needs query parameters: ...?at_from=<seconds of date>&at_to=<seconds of date>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/emission/insert",
  method: "POST",
  neededRole: "internal",
  name: "Insert a new emission.",
  handler: [
    async (req, res) => {
      try {
        const emission: Row_Emission = req.body;
        withDefaultPersistence(res, async (persistence) => {
          const response = await getCurrentSystem().api.insertEmission({
            ...emission,
          });
          const { result, error, errorCode, errorDetails } = response || {};
          if (
            handleErrorOrUndefinedResult(
              res,
              result,
              errorCode || "-1",
              error,
              errorDetails
            )
          ) {
            return;
          }
          const apiResponse: ApiServiceResponse<{ result: typeof result }> = {
            response: { result },
          };
          return res.send(apiResponse);
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
