import crypto from "crypto";

export const generateSecret = (log = false) => {
  const secret = crypto.randomBytes(64).toString("hex");
  log && console.log(secret);
  return secret;
};
