import YAML from "yaml";
import fs from "fs";
import * as IPFS from "ipfs-core";
import chalk from "chalk";

export async function deploy(podPath) {
  console.log(chalk.green("starting ipfs"));
  const ipfs = await IPFS.create();
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

//   console.log(JSON.stringify(result, null, 2));
console.log(YAML.stringify(result))
}
