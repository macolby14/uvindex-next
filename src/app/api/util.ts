import { setGlobalDispatcher, ProxyAgent } from "undici";

export function useProxyIfSet() {
  if (process.env.HTTPS_PROXY) {
    console.log("Using HTTPS_PROXY=", process.env.HTTPS_PROXY);
    // Corporate proxy uses CA not in undici's certificate store
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const dispatcher = new ProxyAgent({
      uri: new URL(process.env.HTTPS_PROXY).toString(),
    });
    setGlobalDispatcher(dispatcher);
  }
}
