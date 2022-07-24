# Pod Protocol

Pod Protocol provides decentralised serverless function services and GraphQL queries

Pod takes a lot of inspiration from The Graph and Orbitdb, the IPLD-based Pod Protocol uses add-only logs instead of inter-peers consensus.

The principles of Pod Protocol.

1. Build: compile a function into WASM using AssemblyScript (looks similar to TypeScript) and upload it to IPFS with a configuration file, the CID is the Pod id
2. Deploy: submit the Pod id to the node to complete the deployment
3. Call: The user sends the command to the node, which checks the input command and runs it through the WASM virtual machine. If it executes successfully, the node will store the command log as a chain via IPLD. If the execution fails, the data will be rolled back. Other nodes can trace back all the way to the beginning CID based on the last CID and complete the data construction
4. Query: querying the stored data via GraphQL

Future functionality: access to call through the configuration file, e.g. holding a certain NFT in order to call

Example.
1. Install the module in packages
2. Go to packages/example
3. Freely modify src/hello.ts
4. Run deploy.js, get the pod id (pod file cid)
[deploy image](https://github.com/poria-cat/PodProtocol/blob/main/assets/pod_deploy.png)
5. Go to packages/node and run app.js
6. Use HTTP API: 
```
POST localhost:3000/create
{
	"cid": "QmXv15dEXvRuwe9WNmmS1gruTEMm8TAEwZ61XFnPVjz96T"
}
```
If it goes well, you will get a return like this

[create image](https://github.com/poria-cat/PodProtocol/blob/main/assets/pod_create.png)

7. Call Method

use HTTP API:
```
POST localhost:3000/call
{
	"podId": "QmXv15dEXvRuwe9WNmmS1gruTEMm8TAEwZ61XFnPVjz96T",
	"container": "Hello",
	"method": "storeWhat",
	"params": ["say"]
}
```

If it goes well, this is what you get back (data stored to Store, logs stored to IPLD)

[pod_call](https://github.com/poria-cat/PodProtocol/blob/main/assets/pod_call.png)

8. Get Data

use HTTP API:
```
GET http://localhost:3000/getStore/:podId
```

If things go well, all the data in the Store will be available, and GraphQL queries will be added in the future to make it easier to query the data.

[pod_query](https://github.com/poria-cat/PodProtocol/blob/main/assets/pod_query.png)
