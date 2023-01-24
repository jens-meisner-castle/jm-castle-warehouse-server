import { Table } from "jm-castle-warehouse-types";
import { masterdataTableColumnsFragment } from "./Masterdata.mjs";

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
  columnsFragment: [
    "article_id VARCHAR(100)",
    "name VARCHAR(100)",
    "image_refs VARCHAR(500)",
    "count_unit VARCHAR(100)",
    "hashtags VARCHAR(500)",
    "www_link VARCHAR(500)",
    masterdataTableColumnsFragment(),
    "PRIMARY KEY(article_id)",
  ].join(", "),
};
