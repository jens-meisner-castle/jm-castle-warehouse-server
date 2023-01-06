import fs from "fs";
import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  InsertResponse,
  Row_ImageContent,
  UnknownErrorCode,
  UpdateResponse,
} from "jm-castle-warehouse-types/build";
import multiparty from "multiparty";
import stream from "stream";
import {
  getQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
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
  url: "/image-content/insert",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image to store.",
    "string"
  ),
  name: "Insert a new image.",
  handler: [
    async (req, res) => {
      try {
        const formData = new multiparty.Form();
        formData.parse(req, async (error, fields, files) => {
          const {
            image_id: bodyImageIdArr,
            image_extension: imageExtensionArr,
          } = fields;
          const { image_id = undefined } =
            typeof req.query === "object" ? req.query : {};
          const bodyImageId = Array.isArray(bodyImageIdArr)
            ? bodyImageIdArr[0]
            : bodyImageIdArr;
          const image_extension = Array.isArray(imageExtensionArr)
            ? imageExtensionArr[0]
            : imageExtensionArr;
          if (image_id && image_id === bodyImageId) {
            withDefaultPersistence(res, async (persistence) => {
              const file: {
                path: string;
                size: number;
                originalFilename: string;
              } = Array.isArray(files.file) ? files.file[0] : files.file;
              const imageStore = getCurrentSystem().getImageStore();
              const {
                width,
                height,
                size,
                error: saveError,
              } = await imageStore.save(file.path, image_id);
              if (saveError) {
                return handleError(res, UnknownErrorCode, saveError);
              }
              const rowToInsert: Row_ImageContent = {
                image_id,
                image_extension,
                width,
                height,
                size_in_bytes: size,
                ...initialMasterdataFields(),
              };
              const response = await persistence.tables.imageContent.insert(
                rowToInsert
              );
              const { result, error, errorCode, errorDetails } = response;
              if (error) {
                return handleError(res, errorCode, error, errorDetails);
              }
              if (!result) {
                return handleError(
                  res,
                  UnknownErrorCode,
                  `Received undefined result from insert image content.`
                );
              }
              const apiResponse: ApiServiceResponse<
                InsertResponse<Row_ImageContent>
              > = { response: { result } };
              return res.send(apiResponse);
            });
          } else {
            return handleError(
              res,
              BadRequestMissingParameterCode,
              "This url needs a query parameter: ...?image_id=<id of the image>"
            );
          }
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/image-content/update",
  method: "POST",
  neededRole: "internal",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image to store.",
    "string"
  ),
  name: "Update an existing image.",
  handler: [
    async (req, res) => {
      try {
        const formData = new multiparty.Form();
        formData.parse(req, async (error, fields, files) => {
          const {
            image_id: bodyImageIdArr,
            image_extension: imageExtensionArr,
            dataset_version: datasetVersionArr,
          } = fields;
          const { image_id = undefined } =
            typeof req.query === "object" ? req.query : {};
          const bodyImageId = Array.isArray(bodyImageIdArr)
            ? bodyImageIdArr[0]
            : bodyImageIdArr;
          const image_extension = Array.isArray(imageExtensionArr)
            ? imageExtensionArr[0]
            : imageExtensionArr;
          const dataset_version = Array.isArray(datasetVersionArr)
            ? datasetVersionArr[0]
            : datasetVersionArr;
          if (image_id && image_id === bodyImageId) {
            withDefaultPersistence(res, async (persistence) => {
              const file: {
                path: string;
                size: number;
                originalFilename: string;
              } = Array.isArray(files.file) ? files.file[0] : files.file;
              const imageStore = getCurrentSystem().getImageStore();
              const {
                width,
                height,
                size,
                error: saveError,
              } = await imageStore.save(file.path, image_id);
              if (saveError) {
                return handleError(res, UnknownErrorCode, saveError);
              }
              const rowToUpdate: Row_ImageContent = {
                image_id,
                image_extension,
                width,
                height,
                size_in_bytes: size,
                dataset_version: Number.parseInt(dataset_version),
                ...without(
                  initialMasterdataFields(),
                  "created_at",
                  "dataset_version"
                ),
              };
              const response = await persistence.tables.imageContent.update(
                rowToUpdate
              );
              const { result, error, errorCode, errorDetails } = response;
              if (error) {
                return handleError(res, errorCode, error, errorDetails);
              }
              if (!result) {
                return handleError(
                  res,
                  UnknownErrorCode,
                  `Received undefined result from update image content.`
                );
              }
              const apiResponse: ApiServiceResponse<
                UpdateResponse<Row_ImageContent>
              > = { response: { result } };
              return res.send(apiResponse);
            });
          } else {
            return handleError(
              res,
              BadRequestMissingParameterCode,
              "This url needs a query parameter: ...?image_id=<id of the image>"
            );
          }
        });
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/image-content/image",
  method: "GET",
  neededRole: "none",
  parameters: getQueryParametersSchema(
    ["image_id", "string", true, "The image id to search."],
    ["dataset_version", "integer", false, "The specific version."]
  ),
  name: "Get image bytes by id.",
  handler: [
    async (req, res) => {
      try {
        const { image_id = undefined, dataset_version = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          const readStream = fs.createReadStream(
            `${getCurrentSystem().getImageStorePath()}/${image_id}`
          );
          const passThrough = new stream.PassThrough();
          stream.pipeline(readStream, passThrough, (err) => {
            if (err) {
              console.log(err);
              return res.sendStatus(400);
            }
          });
          passThrough.pipe(res);
        } else {
          res.send({
            error: `This url needs query a parameter "image_id".`,
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/image-content/rows",
  method: "GET",
  neededRole: "external",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The image id fragment to search.",
    "string"
  ),
  name: "Get image content rows by id fragment.",
  handler: [
    async (req, res) => {
      try {
        const { image_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          withDefaultPersistence(res, async (persistence) => {
            const response =
              await persistence.tables.imageContent.selectLikeImageId({
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
          return handleError(
            res,
            BadRequestMissingParameterCode,
            `This url needs query a parameter "image_id".`
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
