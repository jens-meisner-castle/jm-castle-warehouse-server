import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_Receipt } from "jm-castle-warehouse-types";
import { getQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/receipt/insert",
  method: "POST",
  neededRole: "internal",
  name: "Insert a new receipt.",
  handler: [
    async (req, res) => {
      try {
        const receipt: Row_Receipt = req.body;
        withDefaultPersistence(res, async (persistence) => {
          const response = await getCurrentSystem().api.insertReceipt({
            ...receipt,
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
  url: "/receipt/select/interval",
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
            const response = await persistence.tables.receipt.select({
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

allServices.push({
  url: "/receipt/select/section-article",
  method: "GET",
  neededRole: "internal",
  parameters: getQueryParametersSchema(
    ["section_id", "string", true, "ID of the section"],
    ["article_id", "string", true, "ID of the article"]
  ),
  name: "Select rows by section and article.",
  handler: [
    async (req, res) => {
      try {
        const { section_id = undefined, article_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id && article_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response =
              await persistence.tables.receipt.selectBySectionAndArticle(
                section_id,
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
            "This url needs query parameters: ...?section_id=<ID of the section>&article_id=<ID of the article>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
