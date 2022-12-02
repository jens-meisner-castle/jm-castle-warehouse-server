import fs from "fs";
import { Row_ImageContent } from "jm-castle-warehouse-types/build";
import multiparty from "multiparty";
import stream from "stream";
import { getStrictSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/image-content/insert",
  method: "POST",
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
          console.log(fields, files);
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
            const file: {
              path: string;
              size: number;
              originalFilename: string;
            } = Array.isArray(files.file) ? files.file[0] : files.file;
            const imageStore = getCurrentSystem().getImageStore();
            const { width, height, size } = await imageStore.save(
              file.path,
              image_id
            );
            console.log(width, height, size);
            const persistence = getCurrentSystem().getDefaultPersistence();
            if (persistence) {
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
              const { result, error } = response;
              if (error) {
                res.send({ error });
              } else {
                if (result) {
                  res.send({ response: { result } });
                } else {
                  res.send({
                    error: `Received undefined result from insert image content.`,
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
        });
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/image-content/select",
  method: "GET",
  parameters: getStrictSingleQueryParametersSchema(
    "image_id",
    "The image id to search.",
    "string"
  ),
  name: "Get image bytes by id.",
  handler: [
    async (req, res) => {
      try {
        const { image_id = undefined } =
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

export const services = allServices;
