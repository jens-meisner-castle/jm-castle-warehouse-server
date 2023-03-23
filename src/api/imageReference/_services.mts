import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  UnknownErrorCode,
} from "jm-castle-types";
import { Row_ImageReference } from "jm-castle-warehouse-types/build";
import { getStrictSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { without } from "../../utils/Basic.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { ApiService } from "../Types.mjs";
import {
  handleError,
  handleErrorOrUndefinedResult,
  withDefaultPersistence,
} from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/image-ref/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image reference to create.",
    "string"
  ),
  name: "Insert a new image reference.",
  handler: [
    async (req, res) => {
      try {
        const imageRef: Row_ImageReference = req.body;
        const { image_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.imageReference.insert({
              ...imageRef,
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
            "This url needs a query parameter: ...?image_id=<id of the image>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/image-ref/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image to update.",
    "string"
  ),
  name: "Update an existing image reference.",
  handler: [
    async (req, res) => {
      try {
        const imageRef: Row_ImageReference = req.body;
        const { image_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.imageReference.update({
              ...imageRef,
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
            "This url needs a query parameter: ...?image_id=<id of the image>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/image-ref/select",
  method: "GET",
  neededRole: "external",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image ref to search.",
    "string"
  ),
  name: "Select single image reference by id.",
  handler: [
    async (req, res) => {
      try {
        const { image_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response = await persistence.tables.imageReference.select({
              image_id,
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
          handleError(
            res,
            BadRequestMissingParameterCode,
            "This url needs a query parameter: ...?image_id=<id of the image reference>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
