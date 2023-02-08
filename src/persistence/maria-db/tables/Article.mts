import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumns } from "./Masterdata.mjs";

/**
 * Hersteller: zusätzliche Stammdaten
 * Abstrakte Artikel: z.B. "Monitor" oder "Monitor 30 Zoll" (kann z.B. in einer Bestellanforderung verwendet werden)
 * Besonderheiten (additional_aspects):
 * möglich wäre eine Vorgabe bei abstrakten Artikeln:
 * z.B. für Monitor:
 * "Größe in Zoll": number , "Display port Version": string
 */

export const TODO = {
  manufacturer: "Samsung",
  is_abstract: true,
  additional_aspects: {
    größe: "19 Zoll",
    "daisy chain": true,
    "display port": "1.2",
  },
};

export const TableArticle: Table = {
  id: "article",
  primaryKey: "PRIMARY KEY(article_id)",
  columns: [
    { name: "article_id", type: "varchar(100)" },
    { name: "name", type: "varchar(100)" },
    { name: "image_refs", type: "varchar(500)" },
    { name: "count_unit", type: "varchar(100)" },
    { name: "hashtags", type: "varchar(500)" },
    { name: "www_link", type: "varchar(500)" },
    { name: "manufacturer", type: "varchar(100)" },
    { name: "attributes", type: "varchar(2000)" },
    ...masterdataTableColumns(),
  ],
};
