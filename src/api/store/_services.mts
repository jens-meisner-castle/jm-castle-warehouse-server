import {
  getOptionalSingleQueryParametersSchema,
  getQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

const addJokerToFilterValue = (s: string) => {
  let filterValue = s.startsWith("%") ? s : "%" + s;
  filterValue = filterValue.endsWith("%") ? filterValue : filterValue + "%";
  return filterValue;
};

allServices.push({
  url: "/store/select",
  method: "GET",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select stores by name.",
  handler: async (req, res) => {
    try {
      const { name = undefined } =
        typeof req.query === "object" ? req.query : {};
      const usedName = name ? addJokerToFilterValue(name) : "%";
      const persistence = getCurrentSystem()?.getDefaultPersistence();
      if (persistence) {
        const response = await persistence.tables.store.select({
          name: usedName,
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
    } catch (error) {
      res.send({ error: error.toString() });
    }
  },
});

export const services = allServices;
