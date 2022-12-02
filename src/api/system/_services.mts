import { executeSetup } from "../../system/setup/ExecuteSetup.mjs";
import { getSystemSetupStatus } from "../../system/setup/Status.mjs";
import { getCurrentSystem } from "../../system/status/System.mjs";
import { ApiService } from "../Types.mjs";
const allServices: ApiService[] = [];

allServices.push({
  url: "/system/status",
  method: "GET",
  name: "Get the system status",
  handler: [
    async (req, res) => {
      try {
        const system = getCurrentSystem();
        if (system) {
          const status = await system.getStatus();
          res.send({ response: { status } });
        } else {
          res.send({ error: "No system is currently available." });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});
allServices.push({
  url: "/system/setup-status",
  method: "GET",
  name: "Get the system setup status",
  handler: [
    async (req, res) => {
      try {
        const status = await getSystemSetupStatus();
        res.send({ response: { status } });
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});
allServices.push({
  url: "/system/setup",
  method: "GET",
  name: "Do a system setup. This is a no-op if the system is already setup.",
  handler: [
    async (req, res) => {
      try {
        const setup = await executeSetup();
        res.send({ response: { setup } });
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});
allServices.push({
  url: "/system/control/restart",
  method: "GET",
  name: "Executes a system restart. Current system stops everything and starts a new system based on the current configuration file.",
  handler: [
    async (req, res) => {
      try {
        const system = getCurrentSystem();
        if (system) {
          await system.restart();
          res.send({ response: { success: true } });
        } else {
          res.send({ error: "No system is currently available." });
        }
      } catch (error) {
        res.send({ error: error.toString() });
      }
    },
  ],
});

export const services = allServices;
