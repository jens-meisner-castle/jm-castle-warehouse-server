import {
  ApiServiceResponse,
  UnknownErrorCode,
} from "jm-castle-warehouse-types/build";
import { services as articleServices } from "./article/_services.mjs";
import { services as attributeServices } from "./attribute/_services.mjs";
import { services as authServices } from "./auth/_services.mjs";
import { services as costunitServices } from "./costunit/_services.mjs";
import { services as emissionServices } from "./emission/_services.mjs";
import { services as exampleServices } from "./example/_services.mjs";
import { services as exportServices } from "./export/_services.mjs";
import { services as hashtagServices } from "./hashtag/_services.mjs";
import { services as imageContentServices } from "./imageContent/_services.mjs";
import { services as imageReferenceServices } from "./imageReference/_services.mjs";
import { services as importServices } from "./import/_services.mjs";
import { services as manufacturerServices } from "./manufacturer/_services.mjs";
import { services as receiptServices } from "./receipt/_services.mjs";
import { services as receiverServices } from "./receiver/_services.mjs";
import { services as stockServices } from "./stock/_services.mjs";
import { services as storeServices } from "./store/_services.mjs";
import { services as storeSectionServices } from "./storeSection/_services.mjs";
import { services as systemServices } from "./system/_services.mjs";
import { ApiService, getSerializableServices } from "./Types.mjs";
import { handleError } from "./Utils.mjs";

const allServices: ApiService[] = [];

allServices.push(...systemServices);
allServices.push(...attributeServices);
allServices.push(...storeServices);
allServices.push(...storeSectionServices);
allServices.push(...articleServices);
allServices.push(...hashtagServices);
allServices.push(...receiverServices);
allServices.push(...manufacturerServices);
allServices.push(...receiptServices);
allServices.push(...exampleServices);
allServices.push(...emissionServices);
allServices.push(...stockServices);
allServices.push(...imageReferenceServices);
allServices.push(...imageContentServices);
allServices.push(...exportServices);
allServices.push(...importServices);
allServices.push(...authServices);
allServices.push(...costunitServices);

allServices.push({
  url: "/",
  method: "GET",
  neededRole: "internal",
  name: "Get available services.",
  handler: [
    async (req, res) => {
      try {
        const services = getSerializableServices(allServices);
        const apiResponse: ApiServiceResponse<{ services: typeof services }> = {
          response: { services },
        };
        return res.send(apiResponse);
      } catch (error) {
        return handleError(res, UnknownErrorCode, error.toString());
      }
    },
  ],
});

export const services = allServices;
