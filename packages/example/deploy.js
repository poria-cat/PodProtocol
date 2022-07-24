import {build, deploy} from "@pod/cli"

deploy("./pod.yaml").catch(e => {
    console.log(e)
})

// console.log(fs.readFileSync("./build/Hello.wasm"))