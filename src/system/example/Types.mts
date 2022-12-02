import {
  Row_Article,
  Row_Masterdata,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types/build";

export type OmitMasterdataFields<T extends Row_Masterdata> = Omit<
  Omit<Omit<T, "dataset_version">, "created_at">,
  "edited_at"
>;

export type ArticleExample = OmitMasterdataFields<Row_Article>;
export type ArticleStockExample = Omit<
  Omit<Omit<Omit<Row_Receipt, "by_user">, "at_seconds">, "dataset_id">,
  "section_id"
>;
export type StoreSectionExample = OmitMasterdataFields<
  Omit<Row_StoreSection, "store_id">
> & {
  articleStock: ArticleStockExample[];
};
export type StoreExample = OmitMasterdataFields<Row_Store> & {
  storeSection: StoreSectionExample[];
};

export interface Example {
  name: string;
  store: StoreExample[];
  article: ArticleExample[];
  image: { image_id: string; path: string }[];
}
