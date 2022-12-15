import {
  ApiServiceResponse,
  BadRequestMissingParameterCode,
  LoginResult,
  UnknownErrorCode,
} from "jm-castle-warehouse-types";
import { generateJWT } from "../../auth/GenerateToken.mjs";
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

export const services = allServices;
