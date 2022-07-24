import * as IPFS from "ipfs-core";

export const ipfsClient = async () => {
  const ipfs = await IPFS.create();
  return ipfs;
};

export const getIpfsCID = (uri) => {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "");
  }
  return uri;
};
