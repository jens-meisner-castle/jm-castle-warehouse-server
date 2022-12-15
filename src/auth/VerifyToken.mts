import {
  ErrorCode,
  getErrorCode,
  NameToCodeMap,
} from "jm-castle-warehouse-types/build";
import jwt from "jsonwebtoken";
import { CastleRequestHandler } from "../api/Types.mjs";
import { handleError } from "../api/Utils.mjs";
import { getCurrentSystem } from "../system/status/System.mjs";
import { getTokenSecret } from "./TokenSecret.mjs";

type VerifyTokenResult =
  | { user: string; error?: never; errorCode?: never }
  | { user?: never; error: string; errorCode: ErrorCode };

export const verifyToken = (token: string): Promise<VerifyTokenResult> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getTokenSecret(), (err, payload) => {
      if (err) {
        const { name } = err;
        const errorCode = NameToCodeMap[name] || "-1";
        resolve({
          error: `(${name}) Unable to verify token: ${err.toString()}`,
          errorCode,
        });
      } else {
        const user = typeof payload === "string" ? "?" : payload.iss;
        resolve({ user });
      }
    });
  });
};

export const verifyRequest: CastleRequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    const error = "TokenUndefinedError";
    const errorCode = getErrorCode(error);
    res.status(401).send({ error, errorCode });
  } else {
    try {
      const { user, error, errorCode } = await verifyToken(token);
      if (error) {
        return handleError(res, errorCode, error);
      }
      const roles = getCurrentSystem().getUserRoles(user);
      req.params.verifiedUser = {
        user,
        token,
        roles,
      };
      next();
    } catch (error) {
      const { name } = error as Error;
      const errorCode = getErrorCode(name);
      return handleError(res, errorCode, error.toString());
    }
  }
};

export const makeVerifyRole =
  (role: string): CastleRequestHandler =>
  (req, res, next) => {
    const { roles } = req.params.verifiedUser || {};
    if (!roles || !roles.includes(role)) {
      return res
        .status(401)
        .send({ error: `Role <${role}> needed for this service.` });
    }
    next();
  };
