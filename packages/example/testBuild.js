import {build, deploy} from "@pod/cli"
import fs from "fs"

// build("./pod.yaml")
deploy("./pod.yaml").catch(e => {
    console.log(e)
})

// console.log(fs.readFileSync("./build/Hello.wasm"))