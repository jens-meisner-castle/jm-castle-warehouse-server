import { ColumnStatus } from "jm-castle-warehouse-types/build";

export const masterdataTableColumns = (): ColumnStatus[] => [
  { name: "dataset_version", type: "int(11)" },
  { name: "created_at", type: "int(11)" },
  { name: "edited_at", type: "int(11)" },
];
