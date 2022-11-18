import { Row_Article } from "jm-castle-warehouse-types/build";
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
  url: "/article/insert",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The id of the article to create.",
    "string"
  ),
  name: "Insert a new article.",
  handler: async (req, res) => {
    try {
      const article: Row_Article = req.body;
      const { article_id = undefined } =
        typeof req.query === "object" ? req.query : {};
      if (article_id) {
        const persistence = getCurrentSystem()?.getDefaultPersistence();
        if (persistence) {
          const response = await persistence.tables.article.insert({
            ...article,
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
                error: `Received undefined result from insert article.`,
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
            "This url needs a query parameter: ...?article_id=<id of the article>",
        });
      }
    } catch (error) {
      res.send({ error: error.toString() });
    }
  },
});

allServices.push({
  url: "/article/update",
  method: "POST",
  parameters: getStrictSingleQueryParametersSchema(
    "article_id",
    "The id of the article to update.",
    "string"
  ),
  name: "Update an existing article.",
  handler: async (req, res) => {
    try {
      const article: Row_Article = req.body;
      const { article_id = undefined } =
        typeof req.query === "object" ? req.query : {};
      if (article_id) {
        const persistence = getCurrentSystem()?.getDefaultPersistence();
        if (persistence) {
          const response = await persistence.tables.article.update({
            ...article,
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
                error: `Received undefined result from update article.`,
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
            "This url needs a query parameter: ...?article_id=<id of the article>",
        });
      }
    } catch (error) {
      res.send({ error: error.toString() });
    }
  },
});

allServices.push({
  url: "/article/select",
  method: "GET",
  parameters: getOptionalSingleQueryParametersSchema(
    "name",
    "A fragment of the name to search.",
    "string"
  ),
  name: "Select articles by name.",
  handler: async (req, res) => {
    try {
      const { name = undefined } =
        typeof req.query === "object" ? req.query : {};
      const usedName = name ? addJokerToFilterValue(name) : "%";
      const persistence = getCurrentSystem()?.getDefaultPersistence();
      if (persistence) {
        const response = await persistence.tables.article.select({
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
