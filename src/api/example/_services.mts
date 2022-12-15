import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import { getOptionalSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import {
  AllExamples,
  isExampleName,
} from "../../system/example/AllExamples.mjs";
import { createDataFromExample } from "../../system/example/Utils.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import { handleError, withDefaultPersistence } from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/example/create",
  method: "GET",
  neededRole: "admin",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "The name of the example to create.",
    "string"
  ),
  name: "Create example data.",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined } =
          typeof req.query === "object" ? req.query : {};
        const example = isExampleName(name) ? AllExamples[name] : undefined;
        if (example) {
          withDefaultPersistence(res, async (persistence) => {
            const { verifiedUser } = req.params;
            const { token } = verifiedUser || {};
            const response = await createDataFromExample(
              example,
              getCurrentSystem(),
              persistence,
              token
            );
            const { result, error } = response || {};
            if (error) {
              return handleError(res, UnknownErrorCode, error);
            }
            if (!result) {
              return handleError(
                res,
                UnknownErrorCode,
                "Received no error and undefined result."
              );
            }
            const apiResponse: ApiServiceResponse<Record<string, unknown>> = {
              response: { result },
            };
            return res.send(apiResponse);
          });
        } else {
          return handleError(
            res,
            BadRequestMissingParameterCode,
            `This url needs query a parameter "name", which must be one of: ${Object.keys(
              AllExamples
            ).join(", ")}`
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
