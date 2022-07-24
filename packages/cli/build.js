import YAML from "yaml";
import fs from "fs";
import chalk from "chalk";
import { instantiateSync } from "@assemblyscript/loader";
import { compiler } from "./compiler.js";

export function build(podPath) {
  const file = fs.readFileSync(podPath, "utf8");
  const result = YAML.parse(file);
  // console.log(result);
  if (result.specVersion !== "0.0.1") {
    throw "wrong version";
  }
  let containers = result.pod;
  if (!containers || containers?.length === 0) {
    throw "can't find container";
  }
  containers.forEach((container) => {
    console.log(container);
    let inputFile = container.file;
    let outputFile = `./build/${container.container}.wasm`;
    console.log(chalk.green(`Building ${container.container} container`));
    compiler(inputFile, outputFile)
    const methods = container.handlers.map((handler) => {
      return handler.handler.method;
    });
    const wasmBuffer = fs.readFileSync(outputFile);
    const { exports } = instantiateSync(wasmBuffer, {
      index: {
        "console.log": () => {},
        "store.set": () => {},
        "store.get": () => {},
      },
    });
    let exportModules = Object.keys(exports);
    methods.forEach((method) => {
      if (!exportModules.includes(method)) {
        throw `can't find method: ${method} in ${inputFile}`;
      }
    });
  });
}
