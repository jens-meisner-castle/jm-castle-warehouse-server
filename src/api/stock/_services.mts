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
            const { error, errorCode, errorDetails } = articleResponse || {};
            const articleResult = articleResponse?.result;
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
            const { row: article } = articleResult || {};
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
  url: "/stock/section/select",
  method: "GET",
  neededRole: "external",
  parameters: getStrictSingleQueryParametersSchema(
    "section_id",
    "The section id for the current stock states.",
    "string"
  ),
  name: "Select stock state of all store sections for a single section.",
  handler: [
    async (req, res) => {
      try {
        const { section_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id) {
          withDefaultPersistence(res, async (persistence) => {
            const sectionResponse =
              await persistence.tables.storeSection.selectByKey(section_id);
            const { error, errorCode, errorDetails } = sectionResponse || {};
            const sectionResult = sectionResponse?.result;
            if (
              handleErrorOrUndefinedResult(
                res,
                sectionResult,
                errorCode || "-1",
                error,
                errorDetails
              )
            ) {
              return;
            }
            const section = sectionResult?.row;
            if (!section) {
              return handleError(
                res,
                BadRequestBadParameterCode,
                "For the given section_id is no section available."
              );
            }
            const result = await getCurrentSystem()
              .getArticleStock()
              .stockStateForStoreSection(section);
            const apiResponse: ApiServiceResponse<typeof result> = {
              response: result,
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
