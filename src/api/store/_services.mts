import { Row_Store } from "jm-castle-warehouse-types/build";
import {
  getOptionalSingleQueryParametersSchema,
  getStrictSingleQueryParametersSchema,
} from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { without } from "../../utils/Basic.mjs";
import { addJokerToFilterValue } from "../../utils/Sql.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { ApiService } from "../Types.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/store/select",
  method: "GET",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select stores by name.",
  handler: [
    async (req, res) => {
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
  ],
});

allServices.push({
  url: "/store/insert",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "store_id",
    "The id of the store to create.",
    "string"
  ),
  name: "Insert a new store.",
  handler: [
    async (req, res) => {
      try {
        const store: Row_Store = req.body;
        const { store_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (store_id) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.store.insert({
              ...store,
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
                  error: `Received undefined result from insert store.`,
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
              "This url needs a query parameter: ...?store_id=<id of the store>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/store/update",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "store_id",
    "The id of the store to update.",
    "string"
  ),
  name: "Update an existing store.",
  handler: [
    async (req, res) => {
      try {
        const store: Row_Store = req.body;
        const { store_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (store_id) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.store.update({
              ...store,
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
                  error: `Received undefined result from update store.`,
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
              "This url needs a query parameter: ...?store_id=<id of the store>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

export const services = allServices;
