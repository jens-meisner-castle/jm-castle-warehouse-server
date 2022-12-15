import express from "express";
import { services } from "../api/_services.mjs";
import { makeVerifyRole, verifyRequest } from "../auth/VerifyToken.mjs";

export const router = express.Router();

services.forEach((service) => {
  const { method, url, handler, neededRole } = service;
  const requestHandlers =
    neededRole !== "none"
      ? [verifyRequest, makeVerifyRole(neededRole), ...handler]
      : handler;
  switch (method) {
    case "POST": {
      router.post(url, ...requestHandlers);
      break;
    }
    case "GET":
    default:
      router.get(url, ...requestHandlers);
  }
});
