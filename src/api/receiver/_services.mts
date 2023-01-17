import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  Row_Receiver,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import {
  getOptionalSingleQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { without } from "../../utils/Basic.mjs";
import { addJokerToFilterValue } from "../../utils/Sql.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/receiver/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "receiver_id",
    "The id of the receiver to create.",
    "string"
  ),
  name: "Insert a new receiver.",
  handler: [
    async (req, res) => {
      try {
        const receiver: Row_Receiver = req.body;
        const { receiver_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (receiver_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.receiver.insert({
              ...receiver,
              ...initialMasterdataFields(),
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
            "This url needs a query parameter: ...?receiver_id=<id of the receiver>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/receiver/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "receiver_id",
    "The id of the receiver to update.",
    "string"
  ),
  name: "Update an existing receiver.",
  handler: [
    async (req, res) => {
      try {
        const receiver: Row_Receiver = req.body;
        const { receiver_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (receiver_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.receiver.update({
              ...receiver,
              ...without(
                initialMasterdataFields(),
                "created_at",
                "dataset_version"
              ),
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
            "This url needs a query parameter: ...?receiver_id=<id of the receiver>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/receiver/select",
  method: "GET",
  neededRole: "external",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select receivers by name.",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined } =
          typeof req.query === "object" ? req.query : {};
        const usedName = name ? addJokerToFilterValue(name) : "%";
        withDefaultPersistence(res, async (persistence) => {
          const response = await persistence.tables.receiver.select({
            name: usedName,
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
