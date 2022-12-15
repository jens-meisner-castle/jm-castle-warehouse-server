import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import { getQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/emission/select",
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

export const services = allServices;
