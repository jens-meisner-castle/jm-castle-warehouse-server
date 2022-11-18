import {
  Row_Article,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types/build";
import { without } from "../../utils/Basic.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { CastleWarehouse } from "../status/System.mjs";
import { Example } from "./Types.mjs";

export type ExampleCreationResult =
  | {
      result: Record<string, unknown[]>;
      error?: never;
    }
  | { result?: never; error: string };

export const createDataFromExample = async (
  example: Example,
  system: CastleWarehouse
): Promise<ExampleCreationResult> => {
  const at_seconds = Math.ceil(Date.now() / 1000);
  const articleRows: Row_Article[] = [];
  const storeRows: Row_Store[] = [];
  const storeSectionRows: Row_StoreSection[] = [];
  const receiptRows: Row_Receipt[] = [];
  example.article.forEach((article) => {
    articleRows.push({ ...article, ...initialMasterdataFields() });
  });
  example.store.forEach((store) => {
    storeRows.push({
      ...without({ ...store }, "storeSection"),
      ...initialMasterdataFields(),
    });
    store.storeSection.forEach((storeSection) => {
      storeSectionRows.push({
        ...without({ ...storeSection }, "articleStock"),
        store_id: store.store_id,
        ...initialMasterdataFields(),
      });
      storeSection.articleStock.forEach((articleStock) => {
        receiptRows.push({
          ...articleStock,
          section_id: storeSection.section_id,
          at_seconds,
          by_user: `example-${example.name}`,
          dataset_id: "new",
        });
      });
    });
  });
  const persistence = system.getDefaultPersistence();
  if (persistence) {
    try {
      const articleResults = await Promise.all(
        articleRows.map((row) => persistence.tables.article.insert(row))
      );
      const storeResults = await Promise.all(
        storeRows.map((row) => persistence.tables.store.insert(row))
      );
      const sectionResults = await Promise.all(
        storeSectionRows.map((row) =>
          persistence.tables.storeSection.insert(row)
        )
      );
      const receiptResults = await Promise.all(
        receiptRows.map((row) => persistence.tables.receipt.insert(row))
      );
      const allErrors: string[] = [];
      articleResults.forEach((r) => r.error && allErrors.push(r.error));
      storeResults.forEach((r) => r.error && allErrors.push(r.error));
      sectionResults.forEach((r) => r.error && allErrors.push(r.error));
      receiptResults.forEach((r) => r.error && allErrors.push(r.error));
      if (allErrors.length) {
        return {
          error: `Received errors when inserting rows: ${allErrors.join("\n")}`,
        };
      }
      return {
        result: { storeRows, storeSectionRows, articleRows, receiptRows },
      };
    } catch (error) {
      return {
        error: `Received error when inserting rows: ${error.toString()}`,
      };
    }
  } else {
    return { error: "No default persistence is defined." };
  }
};
