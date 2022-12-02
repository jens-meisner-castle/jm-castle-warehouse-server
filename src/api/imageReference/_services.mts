import { Row_ImageReference } from "jm-castle-warehouse-types/build";
import { getStrictSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { without } from "../../utils/Basic.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/image-ref/insert",
  method: "POST",
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
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.imageReference.insert({
              ...imageRef,
              ...initialMasterdataFields(),
            });
            const { result, error } = response || {};
            if (error) {
              res.send({ error });
            } else {
              if (result) {
                res.send({ response: { result } });
              } else {
                res.send({
                  error: `Received undefined result from insert image reference.`,
                });
              }
            }
          } else {
            res.send({
              error: "Currently is no default persistence available.",
            });
          }
        } else {
          res.send({
            error:
              "This url needs a query parameter: ...?image_id=<id of the image>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/image-ref/update",
  method: "POST",
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
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.imageReference.update({
              ...imageRef,
              ...without(
                without(initialMasterdataFields(), "created_at"),
                "dataset_version"
              ),
            });
            const { result, error } = response || {};
            if (error) {
              res.send({ error });
            } else {
              if (result) {
                res.send({ response: { result } });
              } else {
                res.send({
                  error: `Received undefined result from update image reference.`,
                });
              }
            }
          } else {
            res.send({
              error: "Currently is no default persistence available.",
            });
          }
        } else {
          res.send({
            error:
              "This url needs a query parameter: ...?image_id=<id of the image>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/image-ref/select",
  method: "GET",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The id of the image ref to search.",
    "string"
  ),
  name: "Select single image by id.",
  handler: [
    async (req, res) => {
      try {
        const { image_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (image_id) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.imageReference.select({
              image_id,
            });
            const { result, error } = response || {};
            if (error) {
              res.send({ error });
            } else {
              if (result) {
                res.send({ response: { result } });
              } else {
                res.send({
                  error: `Received undefined result from image select.`,
                });
              }
            }
          } else {
            res.send({
              error: "Currently is no default persistence available.",
            });
          }
        } else {
          res.send({
            error:
              "This url needs a query parameter: ...?image_id=<id of the image reference>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

export const services = allServices;
