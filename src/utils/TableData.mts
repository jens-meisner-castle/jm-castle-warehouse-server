import { Row_Masterdata } from "jm-castle-warehouse-types/build";

export const initialMasterdataFields = (): Row_Masterdata => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return { dataset_version: 1, created_at: nowSeconds, edited_at: nowSeconds };
};
