import {
  DbExportData,
  ErrorCode,
  MariaDatabaseSpec,
  PersistentRow,
  Row_Article,
  Row_Emission,
  Row_Hashtag,
  Row_ImageContent,
  Row_ImageReference,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
  SelectResponse,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { createPool, Pool } from "mariadb";
import { ErrorWithCode } from "../../utils/Basic.mjs";
import { Persistence } from "../Types.mjs";
import {
  all as allFromArticle,
  insert as insertArticle,
  select as selectFromArticle,
  selectByKey as selectByKeyFromArticle,
  update as updateArticle,
} from "./query/Article.mjs";
import {
  all as allFromEmission,
  insert as insertEmission,
  select as selectFromEmission,
} from "./query/Emission.mjs";
import {
  all as allFromHashtag,
  insert as insertHashtag,
  select as selectFromHashtag,
  selectByKey as selectByKeyFromHashtag,
  update as updateHashtag,
} from "./query/Hashtag.mjs";
import {
  all as allFromImageContent,
  insert as insertImageContent,
  select as selectFromImageContent,
  selectLikeImageId as selectFromImageContentLikeImageId,
  update as updateImageContent,
} from "./query/ImageContent.mjs";
import {
  all as allFromImageReference,
  insert as insertImageReference,
  insertImageReferences,
  select as selectFromImageReference,
  update as updateImageReference,
  updateImageReferences,
} from "./query/ImageReference.mjs";
import {
  Filter_At_FromTo_Seconds,
  Filter_ImageExtension,
  Filter_ImageId,
  Filter_NameLike,
  Filter_Reference,
} from "./query/QueryUtils.mjs";
import {
  all as allFromReceipt,
  insert as insertReceipt,
  select as selectFromReceipt,
} from "./query/Receipt.mjs";
import {
  all as allFromStore,
  insert as insertStore,
  select as selectFromStore,
  selectByKey as selectByKeyFromStore,
  update as updateStore,
} from "./query/Store.mjs";
import {
  all as allFromStoreSection,
  insert as insertStoreSection,
  select as selectFromStoreSection,
  selectByKey as selectByKeyFromStoreSection,
  update as updateStoreSection,
} from "./query/StoreSection.mjs";
import { TableArticle } from "./tables/Article.mjs";
import { TableEmission } from "./tables/Emission.mjs";
import { TableHashtag } from "./tables/Hashtag.mjs";
import { TableImageContent } from "./tables/ImageContent.mjs";
import { TableImageReference } from "./tables/ImageReference.mjs";
import { TableReceipt } from "./tables/Receipt.mjs";
import { TableStore } from "./tables/Store.mjs";
import { TableStoreSection } from "./tables/StoreSection.mjs";

export interface RunPartsResponse {
  // milliseconds of duration to run all parts
  duration: number;
  errors?: string[];
}

export const AllTables = [
  TableImageReference,
  TableImageContent,
  TableHashtag,
  TableStore,
  TableStoreSection,
  TableArticle,
  TableReceipt,
  TableEmission,
];

export interface MariaDbClientProps {
  persistenceId: string;
  spec: MariaDatabaseSpec;
}

export class MariaDbClient implements Persistence {
  constructor(props: MariaDbClientProps) {
    const { spec } = props;
    this.spec = spec;
    return this;
  }
  public version = "1.0.0";
  private setupPool: Pool | undefined;
  private databasePool: Pool | undefined;
  private spec: MariaDatabaseSpec;
  private handlePoolError = (error: Error) =>
    console.error("Received error from database pool: " + error.toString());
  public type = () => "maria-db";
  public getDatabaseName = () => this.spec.database;
  public getDatabasePool = () => {
    if (!this.databasePool) {
      const { host, port, user, password, database } = this.spec;
      this.databasePool = createPool({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 10,
        decimalAsNumber: true,
      });
      // eslint-disable-next-line
      // @ts-ignore
      this.databasePool.on("error", this.handlePoolError);
    }
    return this.databasePool;
  };
  public getSetupPool = () => {
    if (!this.setupPool) {
      const { host, port, user, password, database } = this.spec;
      this.setupPool = createPool({
        host,
        port,
        user,
        password,
        connectionLimit: 1,
      });
    }
    return this.setupPool;
  };

  private exportSingleTableData = async function <T>(access: {
    all: () => Promise<SelectResponse<T>>;
  }): Promise<{ rows: T[] }> {
    const { result, error, errorCode } = await access.all();
    if (error) {
      throw new ErrorWithCode(errorCode || UnknownErrorCode, error);
    }
    return { rows: result.rows };
  };

  public exportTableData = async (): Promise<
    { tables: DbExportData["tables"] } | { error: string; errorCode: ErrorCode }
  > => {
    try {
      const hashtag = await this.exportSingleTableData(this.tables.hashtag);
      const article = await this.exportSingleTableData(this.tables.article);
      const store = await this.exportSingleTableData(this.tables.store);
      const storeSection = await this.exportSingleTableData(
        this.tables.storeSection
      );
      const receipt = await this.exportSingleTableData(this.tables.receipt);
      const emission = await this.exportSingleTableData(this.tables.emission);
      const imageReference = await this.exportSingleTableData(
        this.tables.imageReference
      );
      const imageContent = await this.exportSingleTableData(
        this.tables.imageContent
      );
      const tables: DbExportData["tables"] = {
        hashtag,
        article,
        store,
        storeSection,
        receipt,
        emission,
        imageReference,
        imageContent,
      };
      return { tables };
    } catch (error: unknown) {
      return {
        error: (error as ErrorWithCode).toString(),
        errorCode: (error as ErrorWithCode).code,
      };
    }
  };
  public api = {
    insertArticle: async (values: Row_Article & PersistentRow) => {
      const { article_id, image_refs } = values;
      const response = await this.tables.article.insert(values);
      if (response.error) {
        return response;
      }
      const reference = `article-${article_id}`;
      await this.tables.imageReference.insertImageReferences(
        reference,
        image_refs
      );
      return response;
    },
    updateArticle: async (values: Row_Article & PersistentRow) => {
      const { article_id, image_refs } = values;
      const { result: selectResult } = await this.tables.article.selectByKey(
        article_id
      );
      const { rows } = selectResult || {};
      const previous = rows?.length ? rows[0] : undefined;
      const response = await this.tables.article.update(values);
      if (response.error) {
        return response;
      }
      if (previous) {
        const reference = `article-${article_id}`;
        await this.tables.imageReference.updateImageReferences(
          reference,
          previous.image_refs,
          image_refs
        );
      }
      return response;
    },
    insertStore: async (values: Row_Store & PersistentRow) => {
      const { store_id, image_refs } = values;
      const response = await this.tables.store.insert(values);
      if (response.error) {
        return response;
      }
      const reference = `store-${store_id}`;
      await this.tables.imageReference.insertImageReferences(
        reference,
        image_refs
      );
      return response;
    },
    updateStore: async (values: Row_Store & PersistentRow) => {
      const { store_id, image_refs } = values;
      const { result: selectResult } = await this.tables.store.selectByKey(
        store_id
      );
      const { rows } = selectResult || {};
      const previous = rows?.length ? rows[0] : undefined;
      const response = await this.tables.store.update(values);
      if (response.error) {
        return response;
      }
      if (previous) {
        const reference = `store-${store_id}`;
        await this.tables.imageReference.updateImageReferences(
          reference,
          previous.image_refs,
          image_refs
        );
      }
      return response;
    },
    insertStoreSection: async (values: Row_StoreSection & PersistentRow) => {
      const { section_id, image_refs } = values;
      const response = await this.tables.storeSection.insert(values);
      if (response.error) {
        return response;
      }
      const reference = `storeSection-${section_id}`;
      await this.tables.imageReference.insertImageReferences(
        reference,
        image_refs
      );
      return response;
    },
    updateStoreSection: async (values: Row_StoreSection & PersistentRow) => {
      const { section_id, image_refs } = values;
      const { result: selectResult } = await this.tables.store.selectByKey(
        section_id
      );
      const { rows } = selectResult || {};
      const previous = rows?.length ? rows[0] : undefined;
      const response = await this.tables.storeSection.update(values);
      if (response.error) {
        return response;
      }
      if (previous) {
        const reference = `storeSection-${section_id}`;
        await this.tables.imageReference.updateImageReferences(
          reference,
          previous.image_refs,
          image_refs
        );
      }
      return response;
    },
    insertReceipt: async (values: Row_Receipt & PersistentRow) => {
      const { image_refs } = values;
      // dataset_id ist erst nach dem einfügen bekannt (auto increment)
      const response = await this.tables.receipt.insert(values);
      if (response.error) {
        return response;
      }
      const { result } = response;
      const { data } = result;
      const { dataset_id } = data;
      const reference = `receipt-${dataset_id}`;
      await this.tables.imageReference.insertImageReferences(
        reference,
        image_refs
      );
      return response;
    },
  };
  public tables = {
    imageReference: {
      insert: (values: Row_ImageReference & PersistentRow) =>
        insertImageReference(values, this),
      update: (values: Row_ImageReference & PersistentRow) =>
        updateImageReference(values, this),
      updateImageReferences: (
        reference: string,
        previous: string | null,
        current: string | null
      ) => updateImageReferences(reference, previous, current, this),
      insertImageReferences: (reference: string, current: string | null) =>
        insertImageReferences(reference, current, this),
      select: (filter: Filter_ImageId | Filter_Reference) =>
        selectFromImageReference(filter, this),
      all: () => allFromImageReference(this),
    },
    imageContent: {
      insert: (values: Row_ImageContent & PersistentRow) =>
        insertImageContent(values, this),
      update: (values: Row_ImageContent & PersistentRow) =>
        updateImageContent(values, this),
      select: (filter: Filter_ImageId | Filter_ImageExtension) =>
        selectFromImageContent(filter, this),
      selectLikeImageId: (filter: Filter_ImageId) =>
        selectFromImageContentLikeImageId(filter, this),
      all: () => allFromImageContent(this),
    },
    store: {
      insert: (values: Row_Store & PersistentRow) => insertStore(values, this),
      update: (values: Row_Store & PersistentRow) => updateStore(values, this),
      select: (filter: Filter_NameLike) => selectFromStore(filter, this),
      selectByKey: (storeId: string) => selectByKeyFromStore(storeId, this),
      all: () => allFromStore(this),
    },
    storeSection: {
      insert: (values: Row_StoreSection & PersistentRow) =>
        insertStoreSection(values, this),
      update: (values: Row_StoreSection & PersistentRow) =>
        updateStoreSection(values, this),
      select: (filter: Filter_NameLike) => selectFromStoreSection(filter, this),
      selectByKey: (sectionId: string) =>
        selectByKeyFromStoreSection(sectionId, this),
      all: () => allFromStoreSection(this),
    },
    article: {
      insert: (values: Row_Article & PersistentRow) =>
        insertArticle(values, this),
      update: (values: Row_Article & PersistentRow) =>
        updateArticle(values, this),
      select: (filter: Filter_NameLike) => selectFromArticle(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromArticle(articleId, this),
      all: () => allFromArticle(this),
    },
    hashtag: {
      insert: (values: Row_Hashtag & PersistentRow) =>
        insertHashtag(values, this),
      update: (values: Row_Hashtag & PersistentRow) =>
        updateHashtag(values, this),
      select: (filter: Filter_NameLike) => selectFromHashtag(filter, this),
      selectByKey: (articleId: string) =>
        selectByKeyFromHashtag(articleId, this),
      all: () => allFromHashtag(this),
    },
    receipt: {
      insert: (values: Row_Receipt & PersistentRow) =>
        insertReceipt(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromReceipt(filter, this),
      all: () => allFromReceipt(this),
    },
    emission: {
      insert: (values: Row_Emission & PersistentRow) =>
        insertEmission(values, this),
      select: (filter: Filter_At_FromTo_Seconds) =>
        selectFromEmission(filter, this),
      all: () => allFromEmission(this),
    },
  };

  public disconnect = async () => {
    console.log(
      "Disconnecting from Maria Db would cause errors when building new pools..."
    );
    if (this.setupPool) {
      // cannot do this: await this.setupPool.end();
    }
    if (this.databasePool) {
      // cannot do this: await this.databasePool.end();
    }
  };
}
