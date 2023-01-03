import { InitOptions, OnboardAPI } from "@web3-onboard/core";
import { init, Web3OnboardProvider } from '@web3-onboard/react';
import injectedModule from '@web3-onboard/injected-wallets';
import { useContext, useEffect, useRef, useState } from "react";
import { openlogin } from "./plugins";
import { OpenLoginContext } from "../openlogin";


export interface IOnboardProviderProps {
  options?: Omit<InitOptions, "wallets">;
  children?: JSX.Element;
}

const injected = injectedModule();
const defaultOptions: IOnboardProviderProps["options"] = {
  chains: [{
    id: "0xa4ec",
    token: 'CELO',
    label: 'CELO Testnet',
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    namespace: "evm",
  }]
}

export const OnboardProvider = ({ options = defaultOptions, children }: IOnboardProviderProps): JSX.Element |  null => {
  const [onboard, setOnboard] = useState<OnboardAPI>();
  const { sdk } = useContext(OpenLoginContext);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!sdk) {
      return;
    }

    setOnboard(init({
      wallets: [
        openlogin(sdk),
        injected,
      ],
      ...optionsRef.current
    }))
  }, [sdk]);

  return !onboard ? null : <Web3OnboardProvider web3Onboard={onboard}>{children}</Web3OnboardProvider>;
}
