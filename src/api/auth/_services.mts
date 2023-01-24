import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  getErrorCode,
  LoginResult,
  TokenUndefinedErrorCode,
  UnknownClientOrBadIpCode,
  UnknownErrorCode,
  VerifyTokenResult,
} from "jm-castle-warehouse-types";
import { generateJWT } from "../../auth/GenerateToken.mjs";
import { verifyToken } from "../../auth/VerifyToken.mjs";
import { getStrictSingleQueryParametersSchema } from "../../json-schema/parameters.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
import { handleError, withDefaultPersistence } from "../Utils.mjs";

const allServices: ApiService[] = [];

allServices.push({
  url: "/auth/basic",
  method: "POST",
  neededRole: "none",
  parameters: getStrictSingleQueryParametersSchema(
    "user_id",
    "The id of the user.",
    "string"
  ),
  name: "Get a new token for the user.",
  handler: [
    async (req, res) => {
      try {
        const { user, password }: { user: string; password: string } = req.body;
        const { user_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (user_id && user_id === user) {
          withDefaultPersistence(res, async (persistence) => {
            const { roles } =
              getCurrentSystem().authenticateUser(user, password) || {};
            if (!roles) {
              return res.send({
                error: `Unknown user or wrong password for <${user}>.`,
              });
            }
            const { token, expiresAtMs, expiresAtDisplay } = generateJWT(user);
            const result: LoginResult = {
              token,
              expiresAtMs,
              expiresAtDisplay,
              username: user,
              roles,
            };
            const apiResponse: ApiServiceResponse<LoginResult> = {
              response: result,
            };
            return res.send(apiResponse);
          });
        } else {
          return handleError(
            res,
            BadRequestMissingParameterCode,
            "This url needs a query parameter: ...?user_id=<id of the user>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

allServices.push({
  url: "/auth/token",
  method: "GET",
  neededRole: "none",
  name: "Verify a token. Responds always with status 200. Also for invalid tokens.",
  handler: [
    async (req, res) => {
      try {
        const authHeader = req.headers["authorization"];
        const token = Array.isArray(authHeader)
          ? authHeader[0].split(" ")[1]
          : typeof authHeader === "string"
          ? authHeader.split(" ")[1]
          : undefined;
        if (!token) {
          return res.send({
            error: "Authorization header is missing or invalid.",
            errorCode: TokenUndefinedErrorCode,
          });
        }
        try {
          const { username, expiresAtDisplay, expiresAtMs, error, errorCode } =
            await verifyToken(token);
          if (error) {
            return res.send({ error, errorCode });
          }
          const roles = getCurrentSystem().getUserRoles(username);
          const apiResponse: ApiServiceResponse<VerifyTokenResult> = {
            response: {
              username,
              expiresAtDisplay,
              expiresAtMs,
              roles: roles || [],
            },
          };
          return res.send(apiResponse);
        } catch (error) {
          const { name } = error as Error;
          const errorCode = getErrorCode(name);
          return res.send({ errorCode, error: error.toString() });
        }
      } catch (error) {
        return res.send({
          errorCode: UnknownErrorCode,
          error: error.toString(),
        });
      }
    },
  ],
});

allServices.push({
  url: "/auth/client",
  method: "GET",
  neededRole: "none",
  name: "Login with just a client_id.",
  handler: [
    async (req, res) => {
      try {
        const { client_id = undefined } =
          typeof req.query === "object" ? req.query : {};
        if (client_id) {
          const clientIp = req.socket.remoteAddress;
          const authResponse = getCurrentSystem().authenticateClient(
            client_id,
            clientIp
          );
          if (authResponse === undefined || authResponse === false) {
            return handleError(
              res,
              UnknownClientOrBadIpCode,
              authResponse === false
                ? "This client is authorized for a different ip."
                : "This client is unknown."
            );
          }
          const { user: username } = authResponse;
          try {
            const { token, expiresAtMs, expiresAtDisplay } =
              generateJWT(username);
            const roles = getCurrentSystem().getUserRoles(username);
            const result: LoginResult = {
              token,
              expiresAtMs,
              expiresAtDisplay,
              username,
              roles,
            };
            const apiResponse: ApiServiceResponse<LoginResult> = {
              response: result,
            };
            return res.send(apiResponse);
          } catch (error) {
            const { name } = error as Error;
            const errorCode = getErrorCode(name);
            return res.send({ errorCode, error: error.toString() });
          }
        } else {
          return handleError(
            res,
            BadRequestMissingParameterCode,
            "This url needs a query parameter: ...?client_id=<id of the client>"
          );
        }
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
