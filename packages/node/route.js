import boom from "boom";
import YAML from "yaml";
import all from "it-all";
import { BindHelper, wasmRuntime } from "@pod/runtime";
import { ipfsClient, getIpfsCID } from "./ipfs.js";
import { concat as uint8ArrayConcat } from "uint8arrays/concat";

// {"podId": {config: {}, containerRuntimes: { "Hello": {memory, exports, bindHelper}}}}
const pods = {};
const store = {};
const snapshot = {};

export const getRoutesAndIpfs = async () => {
  const client = await ipfsClient();

  // QmXv15dEXvRuwe9WNmmS1gruTEMm8TAEwZ61XFnPVjz96T
  const create = async (req, res) => {
    try {
      const cid = req.body.cid;
      if (!cid) {
        throw "can't get pod cid";
      }

      const content = uint8ArrayConcat(await all(client.cat(cid)));
      console.log("content buffer", content.buffer);

      console.log({ content });
      const podConfig = Buffer.from(content).toString();
      // console.log(YAML.parse(podConfig))
      const parsedConfig = YAML.parse(podConfig);
      let runtimes = {};
      if (parsedConfig.pod?.length > 0) {
        for (let index = 0; index < parsedConfig.pod.length; index++) {
          const container = parsedConfig.pod[index];
          const name = container.container;
          // console.log({ container, name });
          // console.log("cid:", getIpfsCID(container.file))
          const wasmBuffer = uint8ArrayConcat(
            await all(client.cat(getIpfsCID(container.file)))
          );
          runtimes[name] = wasmRuntime(
            Buffer.from(wasmBuffer.buffer),
            cid,
            store,
            snapshot
          );
        }

        if (Object.keys(runtimes).length > 0) {
          pods[cid] = { config: parsedConfig, containerRuntimes: runtimes };
        }
      }

      return `pod ${cid} deployed success!`;
      // return "success";
    } catch (err) {
      console.log(err);
      throw boom.boomify(err);
    }
  };

  const call = async (req, res) => {
    let { podId, container, method, params } = req.body;
    if (!podId || !container || !method) {
      throw boom.boomify(
        new Error("podId or container or method may be empty")
      );
    }

    if (!params) {
      params = [];
    }

    const pod = pods[podId];

    if (!pod) {
      throw boom.boomify(new Error("can't find pod in this node"));
    }

    const config = pod.config;

    console.log(config);

    const findContainer = config.pod.filter((c) => {
      return c.container === container;
    });

    if (findContainer.length === 0) {
      throw boom.boomify(
        new Error(`pod ${podId} have no container: ${container}`)
      );
    }

    console.log(findContainer[0]);

    const handlers = findContainer[0].handlers;

    console.log({ handlers });

    const findMethod = handlers.filter((handler) => {
      console.log({ handler });
      return handler.handler.method === method;
    });

    if (findMethod.length === 0) {
      throw boom.boomify(new Error(`pod ${podId} have no method: ${method}`));
    }

    const handler = findMethod[0];
    const paramsConfig = handler.handler.params;
    console.log(paramsConfig);

    const input = [];

    if (paramsConfig) {
      if (paramsConfig.length !== params.length) {
        throw boom.boomify(
          new Error(
            `params count is wrong, expect count is ${paramsConfig.length} but get ${params.length}`
          )
        );
      }
      // console.log(pods[podId])
      // console.log(pods[podId].containerRuntimes)
      // console.log(pods[podId].containerRuntimes[container].bindHelper)
      // return "www"
      const bindHelper = pods[podId].containerRuntimes[container].bindHelper;
      paramsConfig.forEach((param, index) => {
        const paramType = typeof params[index];
        if (param.type === "string") {
          if (paramType !== "string") {
            throw boom.boomify(
              new Error(
                `param ${param.name} should be string, but give ${paramType}`
              )
            );
          }
          input.push(bindHelper.lowerString(params[index]));
        } else if (param.type === "i32") {
          if (paramType !== "number" || !Number.isInteger(params[index])) {
            throw boom.boomify(
              new Error(
                `param ${param.name} should be i32, but give ${paramType}`
              )
            );
          }
          input.push(params[index]);
        }
      });
    }

    try {
      pods[podId].containerRuntimes[container].exports[method](...input);
    } catch (error) {
      // revert
      if (snapshot[podId]) {
        snapshot[podId].forEach((snapshotItem) => {
          const { entity, id, data } = snapshotItem;
          if (!data) {
            delete store[podId][entity][id];
          } else {
            store[podId][entity][id] = data;
          }
        });
      }
      snapshot = {};
      throw boom.boomify(error);
    }

    return "success";
  };
  const routes = [
    {
      method: "POST",
      url: "/create",
      handler: create,
    },
    {
      method: "POST",
      url: "/call",
      handler: call,
    },
  ];
  return { routes, ipfsClient: client };
};
