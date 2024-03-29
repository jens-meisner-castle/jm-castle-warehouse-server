import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_Article } from "jm-castle-warehouse-types";
import {
  getQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { TableArticle } from "../../persistence/maria-db/tables/Article.mjs";
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
  url: "/article/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The id of the article to create.",
    "string"
  ),
  name: "Insert a new article.",
  handler: [
    async (req, res) => {
      try {
        const article: Row_Article = req.body;
        const { article_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (article_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await getCurrentSystem().api.insertArticle({
              ...article,
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
            "This url needs a query parameter: ...?article_id=<id of the article>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/article/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The id of the article to update.",
    "string"
  ),
  name: "Update an existing article.",
  handler: [
    async (req, res) => {
      try {
        const article: Row_Article = req.body;
        const { article_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (article_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await getCurrentSystem().api.updateArticle({
              ...article,
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
            "This url needs a query parameter: ...?article_id=<id of the article>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/article/find",
  method: "GET",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The id of the article to find.",
    "string"
  ),
  name: "Find an article.",
  handler: [
    async (req, res) => {
      try {
        const { article_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (article_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.article.selectByKey(
              article_id
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
            "This url needs a query parameter: ...?article_id=<id of the article>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/article/select",
  method: "GET",
  neededRole: "external",
  parameters: getQueryParametersSchema(
    ["name", "string", false, "A fragment of the name to search."],
    ["hashtag", "string", false, "A hashtag of the article to search."]
  ),
  name: "Select articles by name.",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined, hashtag = undefined } =
          typeof req.query === "object" ? req.query : {};
        const usedName = name ? addJokerToFilterValue(name) : "%";
        withDefaultPersistence(res, async (persistence) => {
          const response = await persistence.tables.article.select({
            name: usedName,
            hashtag: typeof hashtag === "string" ? [hashtag] : hashtag,
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
  url: "/article/page/select",
  method: "GET",
  neededRole: "external",
  parameters: getQueryParametersSchema(
    ["page", "integer", true, "The n-th part of all data. The first is 0."],
    ["page_size", "integer", true, "The count of rows for each part(page)."]
  ),
  name: "Select paginated articles.",
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
              await persistence.tables.pagination.selectPage<Row_Article>(
                TableArticle,
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
