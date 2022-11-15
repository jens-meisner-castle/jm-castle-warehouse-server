import { RequestHandler } from "express";
import {
  QueryParametersSchema,
  SerializableService,
} from "jm-castle-warehouse-types";

export interface ApiService {
  url: string;
  parameters?: QueryParametersSchema;
  method: "GET";
  scope?: "public" | "private";
  name: string;
  handler: RequestHandler<
    Record<string, any>,
    any,
    any,
    any,
    Record<string, any>
  >;
}

export const getSerializableServices = (services: ApiService[]) => {
  const serializable: SerializableService[] = [];
  services.forEach((service) => {
    serializable.push({
      url: service.url,
      method: service.method,
      parameters: service.parameters,
      name: service.name,
      scope: service.scope,
    });
  });
  return serializable;
};
