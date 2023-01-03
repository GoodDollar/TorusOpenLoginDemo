import { SafeEventEmitterProvider } from "@web3auth/base";
import { useCallback, useEffect, useState } from "react";
import { EthersRPC } from "./sdk";

import { IEthersRPC } from "./types";

export const useEthersRPC = (provider: SafeEventEmitterProvider): IEthersRPC => {
  const [rpc, setRPC] = useState<IEthersRPC>();
  const getChainId = useCallback(async () => rpc?.getChainId(), [rpc]);
  const getAccounts = useCallback(async () => rpc?.getAccounts(), [rpc]);
  const getBalance = useCallback(async () => rpc?.getBalance(), [rpc]);
  const getPrivateKey = useCallback(async () => rpc?.getPrivateKey(), [rpc]);
  
  const signMessage = useCallback(async (originalMessage: string) => {
    return rpc?.signMessage(originalMessage);
  }, [rpc]);

  const sendTransaction = useCallback(async (destination: string, amount: number) => {
    return rpc?.sendTransaction(destination, amount);
  }, [rpc]);

  useEffect(() => {
    let rpc: IEthersRPC | undefined;

    if (provider) {
      rpc = new EthersRPC(provider);
    }

    setRPC(rpc);
  }, [provider]);

  return {
    getChainId,
    getAccounts,
    getBalance,
    getPrivateKey,
    signMessage,
    sendTransaction,
  };
}
