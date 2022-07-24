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

      console.log(pods);
      // memory,exports,bindHelper
      const bindHelper = pods[cid].containerRuntimes["Hello"].bindHelper;
      const helloString = bindHelper.lowerString("just hello!");
      console.log({ helloString, x: bindHelper.lowerString });
      pods[cid].containerRuntimes["Hello"].exports.storeWhat(helloString);
      return pods;
      // return "success";
    } catch (err) {
      console.log(err);
      throw boom.boomify(err);
    }
  };
  const routes = [
    {
      method: "POST",
      url: "/create",
      handler: create,
    },
  ];
  return { routes, ipfsClient: client };
};
