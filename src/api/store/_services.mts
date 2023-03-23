import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_Store } from "jm-castle-warehouse-types/build";
import {
  getOptionalSingleQueryParametersSchema,
  getQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { TableStore } from "../../persistence/maria-db/tables/Store.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
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
  url: "/store/select",
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
          const response = await persistence.tables.store.select({
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
  url: "/store/page/select",
  method: "GET",
  neededRole: "external",
  parameters: getQueryParametersSchema(
    ["page", "integer", true, "The n-th part of all data. The first is 0."],
    ["page_size", "integer", true, "The count of rows for each part(page)."]
  ),
  name: "Select paginated stores.",
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
              await persistence.tables.pagination.selectPage<Row_Store>(
                TableStore,
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

allServices.push({
  url: "/store/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "store_id",
    "The id of the store to create.",
    "string"
  ),
  name: "Insert a new store.",
  handler: [
    async (req, res) => {
      try {
        const store: Row_Store = req.body;
        const { store_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (store_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await getCurrentSystem().api.insertStore({
              ...store,
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
            "This url needs a query parameter: ...?store_id=<id of the store>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/store/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "store_id",
    "The id of the store to update.",
    "string"
  ),
  name: "Update an existing store.",
  handler: [
    async (req, res) => {
      try {
        const store: Row_Store = req.body;
        const { store_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (store_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await getCurrentSystem().api.updateStore({
              ...store,
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
            "This url needs a query parameter: ...?store_id=<id of the store>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
