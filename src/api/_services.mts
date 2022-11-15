import { services as storeServices } from "./store/_services.mjs";
import { services as systemServices } from "./system/_services.mjs";
import { ApiService, getSerializableServices } from "./Types.mjs";

const allServices: ApiService[] = [];

allServices.push(...systemServices);
allServices.push(...storeServices);

allServices.push({
  url: "/",
  method: "GET",
  name: "Get available services.",
  handler: async (req, res) => {
    try {
      const services = getSerializableServices(allServices);
      res.send({ response: { services } });
    } catch (error) {
      res.send({ error: error.toString() });
    }
  },
});

export const services = allServices;
