import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import createError from "http-errors";
import { router as apiRouter } from "./routes/api.mjs";
import { CastleWarehouse } from "./system/status/System.mjs";
import fs from "fs";

export const loggerMiddleware = (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  console.log(`${request.method} ${request.path} ${request.query}`);
  next();
};

export const newExpressApp = (
  port: number | string | false,
  system: CastleWarehouse
) => {
  const app = express();

  app.set("port", port);
  app.use(cors());

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  const clientPath = system.clientPath();
  const indexHtml = fs.readFileSync(`${clientPath}/index.html`);
  app.use(express.static(clientPath));
  const imageStorePath = system.getImageStorePath();
  app.use(
    imageStorePath.startsWith("/") ? imageStorePath : `/${imageStorePath}`,
    express.static(
      imageStorePath.startsWith("/") ? imageStorePath.slice(1) : imageStorePath
    )
  );

  app.use("/api", apiRouter);

  app.get("*", (req: express.Request, res, next) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(indexHtml);
  });

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err: any, req: express.Request, res: any, next: any) {
    console.log(req.url);
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
  return app;
};
