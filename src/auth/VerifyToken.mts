import {
  getErrorCode,
  NameToCodeMap,
  TokenUndefinedErrorCode,
  UnknownErrorCode,
  UserRole,
  VerifyTokenResult,
} from "jm-castle-warehouse-types";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { CastleRequestHandler } from "../api/Types.mjs";
import { handleError } from "../api/Utils.mjs";
import { getCurrentSystem } from "../system/status/System.mjs";
import { getTokenSecret } from "./TokenSecret.mjs";

export const verifyToken = (token: string) => {
  return new Promise<Omit<VerifyTokenResult, "roles">>((resolve, reject) => {
    jwt.verify(token, getTokenSecret(), (err, payload) => {
      if (err) {
        const { name } = err;
        const errorCode = NameToCodeMap[name] || "-1";
        return resolve({
          error: `(${name}) Unable to verify token: ${err.toString()}`,
          errorCode,
        });
      } else {
        if (typeof payload === "object") {
          const { iss: username, exp: expiresAtSeconds } = payload;
          const expiresAtMs = expiresAtSeconds
            ? expiresAtSeconds * 1000
            : Date.now();
          const expiresAt = DateTime.fromMillis(expiresAtMs);
          const expiresAtDisplay = expiresAt.toFormat("yyyy-LL-dd HH:mm:ss");
          return resolve({ username, expiresAtMs, expiresAtDisplay });
        }
        return resolve({
          error: `Bad token payload.`,
          errorCode: UnknownErrorCode,
        });
      }
    });
  });
};

export const verifyRequest: CastleRequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return handleError(
      res,
      TokenUndefinedErrorCode,
      "Authorization header is missing or invalid."
    );
  }
  try {
    const { username, expiresAtDisplay, expiresAtMs, error, errorCode } =
      await verifyToken(token);
    if (error) {
      return handleError(res, errorCode, error);
    }
    const roles = getCurrentSystem().getUserRoles(username);
    req.params.verifiedUser = {
      username,
      token,
      expiresAtDisplay,
      expiresAtMs,
      roles: roles || [],
    };
    next();
  } catch (error) {
    const { name } = error as Error;
    const errorCode = getErrorCode(name);
    return handleError(res, errorCode, error.toString());
  }
};

export const makeVerifyRole =
  (role: UserRole | "any"): CastleRequestHandler =>
  (req, res, next) => {
    const { roles } = req.params.verifiedUser || {};
    if (!roles || (role !== "any" && !roles.includes(role))) {
      return res
        .status(401)
        .send({ error: `Role <${role}> needed for this service.` });
    }
    next();
  };
