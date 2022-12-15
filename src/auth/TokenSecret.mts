import { generateSecret } from "./GenerateSecret.mjs";

let TokenSecret: string | undefined = undefined;

export const getTokenSecret = () => {
  if (!TokenSecret) {
    TokenSecret = generateSecret();
  }

  return TokenSecret;
};
