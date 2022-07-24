import {build, deploy} from "@pod/cli"

// build("./pod.yaml")
deploy("./pod.yaml").catch(e => {
    console.log(e)
})