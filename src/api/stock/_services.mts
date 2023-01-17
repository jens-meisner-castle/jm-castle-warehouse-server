import {
  ApiServiceResponse,
  BadRequestBadParameterCode,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { getStrictSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/stock/article/select",
  method: "GET",
  neededRole: "external",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The article id for the current stock states.",
    "string"
  ),
  name: "Select stock state of all store sections for a single article.",
  handler: [
    async (req, res) => {
      try {
        const { article_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (article_id) {
          withDefaultPersistence(res, async (persistence) => {
            const articleResponse =
              await persistence.tables.article.selectByKey(article_id);
            const {
              result: articleResult,
              error,
              errorCode,
              errorDetails,
            } = articleResponse || {};
            if (
              handleErrorOrUndefinedResult(
                res,
                articleResult,
                errorCode || "-1",
                error,
                errorDetails
              )
            ) {
              return;
            }
            const { rows: articleRows } = articleResult || {};
            const article =
              articleRows && articleRows.length ? articleRows[0] : undefined;
            if (!article) {
              return handleError(
                res,
                BadRequestBadParameterCode,
                "For the given article_id is no article available."
              );
            }
            const result = await getCurrentSystem()
              .getArticleStock()
              .stockStateForArticle(article);
            const apiResponse: ApiServiceResponse<typeof result> = {
              response: result,
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
  url: "/stock/section/all",
  method: "GET",
  neededRole: "external",
  name: "Select all stock states of all store sections.",
  handler: [
    async (req, res) => {
      try {
        withDefaultPersistence(res, async (persistence) => {
          const result = await getCurrentSystem()
            .getArticleStock()
            .stockStateForAllStoreSections();
          const apiResponse: ApiServiceResponse<typeof result> = {
            response: result,
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
  url: "/stock/article/all",
  method: "GET",
  neededRole: "external",
  name: "Select all stock states of all articles.",
  handler: [
    async (req, res) => {
      try {
        withDefaultPersistence(res, async (persistence) => {
          const result = await getCurrentSystem()
            .getArticleStock()
            .stockStateForAllArticles();
          const apiResponse: ApiServiceResponse<typeof result> = {
            response: result,
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
