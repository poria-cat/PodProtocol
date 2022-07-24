import YAML from "yaml";
import fs from "fs";
import * as IPFS from "ipfs-core";
import chalk from "chalk";
import all from "it-all";
import { build } from "./build.js";

function getIpfsCID(uri) {
  if (uri.startsWith("ipfs://")) {
    return uri.remove("ipfs://");
  }
  return uri;
}

export async function deploy(podPath) {
  build(podPath);

  console.log(chalk.green("starting ipfs"));
  const ipfs = await IPFS.create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
  console.log(chalk.green("ipfs started"));

  const file = fs.readFileSync(podPath, "utf8");
  const result = YAML.parse(file);

  let containers = result.pod;

  for (let index = 0; index < containers.length; index++) {
    const container = containers[index];

    let wasmFile = `./build/${container.container}.wasm`;
    if (!fs.existsSync(wasmFile)) throw `${wasmFile} not exists`;
    console.log(chalk.green(`adding ${wasmFile} to ipfs`));
    const { cid } = await ipfs.add("hello");
    result.pod[index].file = `ipfs://${cid.toString()}`;
  }

  const { cid } = await ipfs.add(YAML.stringify(result));
  console.log("pod file cid:", chalk.green(cid.toString()));
  //   const content = await all(ipfs.cat(getIpfsCID(cid.toString())))
  //   console.log(Buffer.from(content[0]).toString())
}
