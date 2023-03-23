import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_Costunit } from "jm-castle-warehouse-types/build";
import {
  getOptionalSingleQueryParametersSchema,
  getQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { TableCostunit } from "../../persistence/maria-db/tables/Costunit.mjs";
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
  url: "/costunit/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "unit_id",
    "The id of the costunit to create.",
    "string"
  ),
  name: "Insert a new costunit.",
  handler: [
    async (req, res) => {
      try {
        const costunit: Row_Costunit = req.body;
        const { unit_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (unit_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.costunit.insert({
              ...costunit,
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
            "This url needs a query parameter: ...?unit_id=<id of the costunit>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/costunit/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "unit_id",
    "The id of the costunit to update.",
    "string"
  ),
  name: "Update an existing costunit.",
  handler: [
    async (req, res) => {
      try {
        const costunit: Row_Costunit = req.body;
        const { unit_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (unit_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.costunit.update({
              ...costunit,
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
            "This url needs a query parameter: ...?unit_id=<id of the costunit>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/costunit/select",
  method: "GET",
  neededRole: "external",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select costunits by name.",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined } =
          typeof req.query === "object" ? req.query : {};
        const usedName = name ? addJokerToFilterValue(name) : "%";
        withDefaultPersistence(res, async (persistence) => {
          const response = await persistence.tables.costunit.select({
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

allServices.push({
  url: "/costunit/page/select",
  method: "GET",
  neededRole: "external",
  parameters: getQueryParametersSchema(
    ["page", "integer", true, "The n-th part of all data. The first is 0."],
    ["page_size", "integer", true, "The count of rows for each part(page)."]
  ),
  name: "Select paginated costunits.",
  handler: [
    async (req, res) => {
      try {
        const { page = undefined, page_size = undefined } =
          typeof req.query === "object" ? req.query : {};
        const pageNumber = page ? Number.parseInt(page) : undefined;
        const pageSizeNumber = page_size
          ? Number.parseInt(page_size)
          : undefined;
        if (
          typeof pageNumber === "number" &&
          typeof pageSizeNumber === "number"
        ) {
          withDefaultPersistence(res, async (persistence) => {
            const response =
              await persistence.tables.pagination.selectPage<Row_Costunit>(
                TableCostunit,
                pageNumber,
                pageSizeNumber
              );
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
            "This url needs query parameters: ...?page=<index of the requested page>&page_size=<count of rows for each page>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
