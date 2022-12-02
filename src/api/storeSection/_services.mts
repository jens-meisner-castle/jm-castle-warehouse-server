import { Row_StoreSection } from "jm-castle-warehouse-types/build";
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
  url: "/store-section/insert",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "section_id",
    "The id of the section to create.",
    "string"
  ),
  name: "Insert a new section.",
  handler: [
    async (req, res) => {
      try {
        const section: Row_StoreSection = req.body;
        const { section_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.storeSection.insert({
              ...section,
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
                  error: `Received undefined result from insert section.`,
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
              "This url needs a query parameter: ...?section_id=<id of the section>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/store-section/update",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "section_id",
    "The id of the section to update.",
    "string"
  ),
  name: "Update an existing section.",
  handler: [
    async (req, res) => {
      try {
        const section: Row_StoreSection = req.body;
        const { section_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (section_id) {
          const persistence = getCurrentSystem()?.getDefaultPersistence();
          if (persistence) {
            const response = await persistence.tables.storeSection.update({
              ...section,
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
                  error: `Received undefined result from update section.`,
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
              "This url needs a query parameter: ...?section_id=<id of the section>",
          });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

allServices.push({
  url: "/store-section/select",
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
          const response = await persistence.tables.storeSection.select({
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

export const services = allServices;
