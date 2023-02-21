import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { getQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { MasterdataTables } from "../../persistence/maria-db/MariaDb.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/masterdata/select/interval",
  method: "GET",
  neededRole: "internal",
  parameters: getQueryParametersSchema(
    [
      "source",
      "string",
      true,
      "Masterdata type",
      Object.keys(MasterdataTables),
    ],
    ["at_from", "integer", true, "Interval start (in seconds)"],
    ["at_to", "integer", true, "Interval end (in seconds)"]
  ),
  name: "Select rows by edited_at interval.",
  handler: [
    async (req, res) => {
      try {
        const {
          source = undefined,
          at_from = undefined,
          at_to = undefined,
        } = typeof req.query === "object" ? req.query : {};
        if (source && at_from && at_to) {
          withDefaultPersistence(res, async (persistence) => {
            const response =
              await persistence.tables.masterdata.selectEditedAtFromTo(source, {
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

export const services = allServices;
