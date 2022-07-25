import YAML from "yaml";
import fs from "fs";
import chalk from "chalk";
import { instantiateSync } from "@assemblyscript/loader";
import { compiler } from "./compiler.js";
import {parseSchema} from "./parse/schema.js"

export function build(podPath) {
  const file = fs.readFileSync(podPath, "utf8");
  const result = YAML.parse(file);
  // console.log(result);
  if (result.specVersion !== "0.0.1") {
    throw "wrong version";
  }
  // checking schema
  if (!result.schema) {
    throw "schema not defined";
  }
  if(!fs.existsSync(result.schema)) {
    throw "can't find schema";
  }
  const parsedSchema = parseSchema(fs.readFileSync(result.schema).toString())
  console.log(parsedSchema)
  for (const entityName in parsedSchema) {
    const entity = parsedSchema[entityName]
    let id = entity.id
    if (!id) {
      throw `expect ${entityName} have id attribute, but can't find it`
    }
    if (id.allowNull) {
      throw `id can't be empty, but ${entityName}'s id allow null`
    }
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
