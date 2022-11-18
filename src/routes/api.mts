import express from "express";
import { services } from "../api/_services.mjs";

export const router = express.Router();

services.forEach((service) => {
  const { method, url, handler } = service;
  switch (method) {
    case "POST":
      router.post(service.url, service.handler);
      break;
    case "GET":
    default:
      router.get(service.url, service.handler);
  }
});
