import YAML from "yaml";
import fs from "fs"

const file = fs.readFileSync('../pod.yaml', 'utf8')
const result = YAML.parse(file)

console.log(result)
console.log(YAML.stringify(result))