import FormData from "form-data";
import fs from "fs";
import http from "http";
import https from "https";
import {
  ApiServiceResponse,
  InsertResponse,
  UnknownErrorCode,
} from "jm-castle-types";
import {
  Row_Article,
  Row_Costunit,
  Row_Hashtag,
  Row_ImageContent,
  Row_Manufacturer,
  Row_Receipt,
  Row_Store,
  Row_StoreSection,
} from "jm-castle-warehouse-types";
import { Persistence } from "../../persistence/Types.mjs";
import { without } from "../../utils/Basic.mjs";
import { getExtension, getFilename } from "../../utils/File.mjs";
import { initialMasterdataFields } from "../../utils/TableData.mjs";
import { CastleWarehouse, getCurrentSystem } from "../status/System.mjs";
import { Example } from "./Types.mjs";

export type ExampleCreationResult =
  | {
      result: Record<string, unknown[]>;
      error?: never;
    }
  | { result?: never; error: string };

export const createDataFromExample = async (
  example: Example,
  system: CastleWarehouse,
  persistence: Persistence,
  token: string
): Promise<ExampleCreationResult> => {
  const receipt_at = Math.ceil(Date.now() / 1000);
  const hashtagRows: Row_Hashtag[] = [];
  const costunitRows: Row_Costunit[] = [];
  const manufacturerRows: Row_Manufacturer[] = [];
  const articleRows: Row_Article[] = [];
  const imageSources: {
    image_id: string;
    blob: Blob;
    path: string;
    filename: string;
    image_extension: string;
  }[] = [];
  const storeRows: Row_Store[] = [];
  const storeSectionRows: Row_StoreSection[] = [];
  const receiptRows: Row_Receipt[] = [];
  example.article.forEach((article) => {
    articleRows.push({ ...article, ...initialMasterdataFields() });
  });
  example.hashtag.forEach((hashtag) => {
    hashtagRows.push({ ...hashtag, ...initialMasterdataFields() });
  });
  example.costunit.forEach((costunit) => {
    costunitRows.push({ ...costunit, ...initialMasterdataFields() });
  });
  example.manufacturer.forEach((manufacturer) => {
    manufacturerRows.push({ ...manufacturer, ...initialMasterdataFields() });
  });
  for (let i = 0; i < example.image.length; i++) {
    const imageSpec = example.image[i];
    const { image_id, path } = imageSpec;
    const image_extension = getExtension(path);
    const filename = getFilename(path);
    const buffer = fs.readFileSync(path);
    imageSources.push({
      image_id,
      image_extension,
      path,
      blob: new Blob([buffer]),
      filename,
    });
  }
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
          receipt_at,
          by_user: `example-${example.name}`,
          dataset_id: "new",
        });
      });
    });
  });
  try {
    const hashtagResults = await Promise.all(
      hashtagRows.map((row) => persistence.tables.hashtag.insert(row))
    );
    const costunitResults = await Promise.all(
      costunitRows.map((row) => persistence.tables.costunit.insert(row))
    );
    const manufacturerResults = await Promise.all(
      manufacturerRows.map((row) => persistence.tables.manufacturer.insert(row))
    );
    const articleResults = await Promise.all(
      articleRows.map((row) => {
        return new Promise<InsertResponse<Row_Article>>((resolve, reject) => {
          const { article_id } = row;
          const certificate = system.getCACertificate();
          const options: https.RequestOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
            ca: certificate || undefined,
            rejectUnauthorized: !!certificate,
          };
          const url = `${system.getOwnApiUrl()}/article/insert?article_id=${article_id}`;
          const request = https.request(url, options, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => {
              chunks.push(chunk);
            });
            res.on("end", () => {
              let responseString = "";
              try {
                chunks.forEach((chunk) => {
                  responseString = responseString + chunk.toString("utf-8");
                });
                const responseObj: ApiServiceResponse<
                  InsertResponse<Row_Article>
                > = JSON.parse(responseString);
                const { response, error, errorCode, errorDetails } =
                  responseObj;
                if (error) {
                  return resolve({ error, errorCode, errorDetails });
                }
                resolve(response);
              } catch (error) {
                resolve({
                  error: error.toString(),
                  errorCode: UnknownErrorCode,
                });
              }
            });
          });

          request.on("error", function (error) {
            console.error(error);
            resolve({ error: error.toString() });
          });
          request.write(JSON.stringify(row));
          request.end();
        });
      })
    );
    const storeResults = await Promise.all(
      storeRows.map((row) => getCurrentSystem().api.insertStore(row))
    );
    const sectionResults = await Promise.all(
      storeSectionRows.map((row) =>
        getCurrentSystem().api.insertStoreSection(row)
      )
    );
    const receiptResults = await Promise.all(
      receiptRows.map((row) => getCurrentSystem().api.insertReceipt(row))
    );
    const imageContentResults = await Promise.all(
      imageSources.map((source) => {
        return new Promise<InsertResponse<Row_ImageContent>>(
          (resolve, reject) => {
            const { image_id, image_extension, path } = source;
            const formData = new FormData();
            formData.append("image_id", image_id);
            formData.append("image_extension", image_extension);
            formData.append("file", fs.createReadStream(path));

            const certificate = system.getCACertificate();
            const options: https.RequestOptions = {
              method: "POST",
              headers: {
                ...formData.getHeaders(),
                authorization: `Bearer ${token}`,
              },
              ca: certificate || undefined,
              rejectUnauthorized: !!certificate,
            };
            const url = `${system.getOwnApiUrl()}/image-content/insert?image_id=${image_id}`;
            const chunks: Buffer[] = [];
            const request = https.request(
              url,
              options,
              (response: http.IncomingMessage) => {
                response.on("data", (chunk: Buffer) => {
                  chunks.push(chunk);
                });
                response.on("end", () => {
                  let responseString = "";
                  try {
                    chunks.forEach((chunk) => {
                      responseString = responseString + chunk.toString("utf-8");
                    });
                    const responseObj: ApiServiceResponse<
                      InsertResponse<Row_ImageContent>
                    > = JSON.parse(responseString);
                    const { response, error, errorCode, errorDetails } =
                      responseObj;
                    if (error) {
                      return resolve({
                        error,
                        errorCode,
                        errorDetails,
                      });
                    }
                    resolve(response);
                  } catch (error) {
                    resolve({
                      error: error.toString(),
                      errorCode: UnknownErrorCode,
                    });
                  }
                });
              }
            );
            request.on("error", function (error) {
              console.error(error);
              resolve({ error: error.toString(), errorCode: UnknownErrorCode });
            });
            formData.pipe(request);
          }
        );
      })
    );
    const allErrors: string[] = [];
    hashtagResults.forEach((r) => r.error && allErrors.push(r.error));
    costunitResults.forEach((r) => r.error && allErrors.push(r.error));
    manufacturerResults.forEach((r) => r.error && allErrors.push(r.error));
    articleResults.forEach((r) => r.error && allErrors.push(r.error));
    storeResults.forEach((r) => r.error && allErrors.push(r.error));
    sectionResults.forEach((r) => r.error && allErrors.push(r.error));
    receiptResults.forEach((r) => r.error && allErrors.push(r.error));
    imageContentResults.forEach((r) => r.error && allErrors.push(r.error));
    if (allErrors.length) {
      return {
        error: `Received errors when inserting rows: ${allErrors.join("\n")}`,
      };
    }
    return {
      result: {
        storeRows,
        storeSectionRows,
        articleRows,
        receiptRows,
        hashtagRows,
        costunitRows,
        manufacturerRows,
      },
    };
  } catch (error) {
    return {
      error: `Received error when inserting rows: ${error.toString()}`,
    };
  }
};
