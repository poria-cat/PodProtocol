import YAML from "yaml";
import fs from "fs";
import * as IPFS from "ipfs-core";
import chalk from "chalk";
import all from "it-all";
import { build } from "./build.js";

export async function deploy(podPath) {
  build(podPath);

  console.log(chalk.green("starting ipfs"));
  const ipfs = await IPFS.create();
  console.log(chalk.green("ipfs started"));

  const file = fs.readFileSync(podPath, "utf8");
  const result = YAML.parse(file);

  const schemaFile = result.schema;

  const { cid: schemaCid } = await ipfs.add(fs.readFileSync(schemaFile));
  result.schema = `ipfs://${schemaCid.toString()}`;

  let containers = result.pod;

  for (let index = 0; index < containers.length; index++) {
    const container = containers[index];

    let wasmFile = `./build/${container.container}.wasm`;
    if (!fs.existsSync(wasmFile)) throw `${wasmFile} not exists`;
    console.log(chalk.green(`adding ${wasmFile} to ipfs`));
    const { cid } = await ipfs.add(fs.readFileSync(wasmFile));
    result.pod[index].file = `ipfs://${cid.toString()}`;
  }

  const { cid } = await ipfs.add(YAML.stringify(result));
  console.log("pod file cid:", chalk.green(cid.toString()));

  // const content = await all(ipfs.cat(cid.toString()));
  // console.log(Buffer.from(content[0]).toString());
  process.exit(1);
}
