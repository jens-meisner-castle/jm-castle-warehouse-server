import {
  Row_Article,
  Row_Costunit,
  Row_Hashtag,
  Row_Manufacturer,
  Row_Masterdata,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types/build";

export type OmitMasterdataFields<T extends Row_Masterdata> = Omit<
  Omit<Omit<T, "dataset_version">, "created_at">,
  "edited_at"
>;

export type HashtagExample = OmitMasterdataFields<Row_Hashtag>;
export type CostUnitExample = OmitMasterdataFields<Row_Costunit>;
export type ManufacturerExample = OmitMasterdataFields<Row_Manufacturer>;
export type ArticleExample = OmitMasterdataFields<Row_Article>;
export type ArticleStockExample = Omit<
  Omit<Omit<Omit<Row_Receipt, "by_user">, "receipt_at">, "dataset_id">,
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
  hashtag: HashtagExample[];
  costunit: CostUnitExample[];
  manufacturer: ManufacturerExample[];
  store: StoreExample[];
  article: ArticleExample[];
  image: { image_id: string; path: string }[];
}
