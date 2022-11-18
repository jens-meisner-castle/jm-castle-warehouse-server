import { getQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/receipt/select",
  method: "GET",
  parameters: getQueryParametersSchema(
    ["at_from", "integer", true, "Interval start (in seconds)"],
    ["at_to", "integer", true, "Interval end (in seconds)"]
  ),
  name: "Select rows by interval.",
  handler: async (req, res) => {
    try {
      const { at_from = undefined, at_to = undefined } =
        typeof req.query === "object" ? req.query : {};
      if (at_from && at_to) {
        const persistence = getCurrentSystem()?.getDefaultPersistence();
        if (persistence) {
          const response = await persistence.tables.receipt.select({
            at_from,
            at_to,
          });
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
          error:
            "This url needs query parameters: ...?at_from=<seconds of date>&at_to=<seconds of date>",
        });
      }
    } catch (error) {
      res.send({ error: error.toString() });
    }
  },
});

export const services = allServices;
