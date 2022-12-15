import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { getTokenSecret } from "./TokenSecret.mjs";

export const generateJWT = (user: string) => {
  const payload: jwt.JwtPayload = { iss: user };
  const nowDT = DateTime.now();
  const minSeconds = 60 * 60;
  const duration = nowDT.endOf("day").diff(nowDT); //  Duration.fromObject({ minutes: 5 });
  const expiresIn = Math.ceil(Math.max(duration.toMillis() / 1000, minSeconds));
  const expiresAt = nowDT.plus({ seconds: expiresIn });

  return {
    token: jwt.sign(payload, getTokenSecret(), { expiresIn }),
    expiresAtMs: expiresAt.toMillis(),
    expiresAtDisplay: expiresAt.toFormat("yyyy-LL-dd HH:mm:ss"),
  };
};
