import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  Row_StoreSection,
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
  url: "/store-section/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "section_id",
    "The id of the section to create.",
    "string"
  ),
  name: "Insert a new section.",
  handler: [
    async (req, res) => {
      try {
        const storeSection: Row_StoreSection = req.body;
        const { section_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.api.insertStoreSection({
              ...storeSection,
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
            "This url needs a query parameter: ...?section_id=<id of the section>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/store-section/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "section_id",
    "The id of the section to update.",
    "string"
  ),
  name: "Update an existing section.",
  handler: [
    async (req, res) => {
      try {
        const storeSection: Row_StoreSection = req.body;
        const { section_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id) {
          withDefaultPersistence(res, async (persistence) => {
            const { result: selectResult } =
              await persistence.tables.storeSection.selectByKey(section_id);
            const { rows } = selectResult || {};
            const response = await persistence.api.updateStoreSection({
              ...storeSection,
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
            "This url needs a query parameter: ...?section_id=<id of the section>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/store-section/select",
  method: "GET",
  neededRole: "external",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select stores by name.",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined } =
          typeof req.query === "object" ? req.query : {};
        const usedName = name ? addJokerToFilterValue(name) : "%";
        withDefaultPersistence(res, async (persistence) => {
          const response = await persistence.tables.storeSection.select({
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
