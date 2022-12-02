import { getOptionalSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import {
  AllExamples,
  isExampleName,
} from "../../system/example/AllExamples.mjs";
import { createDataFromExample } from "../../system/example/Utils.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/example/create",
  method: "GET",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "The name of the example to create.",
    "string"
  ),
  name: "Create example data (name: 'home').",
  handler: [
    async (req, res) => {
      try {
        const { name = undefined } =
          typeof req.query === "object" ? req.query : {};
        const example = isExampleName(name) ? AllExamples[name] : undefined;
        if (example) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await createDataFromExample(
              example,
              getCurrentSystem()
            );
            const { result, error } = response || {};
            if (error) {
              res.send({ error });
            } else {
              if (result) {
                res.send({ response: { result } });
              } else {
                res.send({ error: `Received undefined result from select.` });
              }
            }
          } else {
            res.send({
              error: "Currently is no default persistence available.",
            });
          }
        } else {
          res.send({
            error: `This url needs query a parameter "name", which must be one of: ${Object.keys(
              AllExamples
            ).join(", ")}`,
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

export const services = allServices;
