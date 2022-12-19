import { RequestHandler } from "express";
import {
  QueryParametersSchema,
  SerializableService,
  UserRole,
} from "jm-castle-warehouse-types";

export type ExtendedParams = Record<string, any> & {
  verifiedUser?: {
    username: string;
    roles: string[];
    token: string;
    expiresAtMs: number;
    expiresAtDisplay: string;
  };
};
export type CastleRequestHandler = RequestHandler<
  ExtendedParams,
  any,
  any,
  any,
  Record<string, any>
>;

export interface ApiService {
  url: string;
  parameters?: QueryParametersSchema;
  method: "GET" | "POST";
  scope?: "public" | "private";
  neededRole: UserRole | "none" | "any";
  name: string;
  handler: CastleRequestHandler[];
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
      neededRole: service.neededRole,
    });
  });
  return serializable;
};
