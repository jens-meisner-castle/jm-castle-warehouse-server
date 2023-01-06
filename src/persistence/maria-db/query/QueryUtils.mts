import { PersistentRow } from "jm-castle-warehouse-types";

export interface Filter_NameLike {
  name: string;
}

export type Filter_ImageId = {
  image_id: string;
  reference?: never;
};

export type Filter_Reference = {
  reference: string;
  image_id?: never;
};

export type Filter_ImageReference = {
  reference?: string;
  image_id?: string;
};

export type Filter_ImageExtension = {
  image_extension: string;
  image_id?: never;
};

export const isFilterImageExtension = (
  obj: Record<string, unknown>
): obj is Filter_ImageExtension => {
  return !!obj.image_extension;
};

export interface Filter_At_FromTo_Seconds {
  at_from: number;
  at_to: number;
}

export const valueInClause = (v: any) => {
  return typeof v !== "number" && !v
    ? "NULL"
    : typeof v === "string"
    ? `'${v}'`
    : typeof v === "boolean"
    ? v === true
      ? 1
      : 0
    : `${v.toString()}`;
};
export const valuesClause = (values: PersistentRow) => {
  return Object.keys(values)
    .map(
      (k: keyof PersistentRow, i) =>
        `${i > 0 ? "," : ""} ${k} = ${valueInClause(values[k])}`
    )
    .join("");
};
