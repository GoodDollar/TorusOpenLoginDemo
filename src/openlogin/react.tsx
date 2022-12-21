import { UserInfo } from "@web3auth/base";
import { createContext, ReactElement, useCallback, useContext, useEffect, useRef, useState } from "react";

import SDK from "./sdk";
import { IOpenLoginOptions, IOpenLoginSDK } from "./types";

export interface IOpenLoginProviderProps {
  clientId: string;
  children?: ReactElement;
}

export interface IOpenLoginContext {
  userInfo: Partial<UserInfo> | null;
  sdk: IOpenLoginSDK | undefined;
}

// user, login, logout
export interface IOpenLoginHook {
  isLoggedIn: boolean;
  userInfo: Partial<UserInfo> | null;
  login: SDK["login"];
  logout: SDK["logout"];
};

export type IEthersRPCHook = Pick<IOpenLoginSDK, 
  "getAccounts" | 
  "getBalance" | 
  "getChainId" | 
  "getPrivateKey" | 
  "sendTransaction" | 
  "signMessage"
>;

export const OpenLoginContext = createContext<IOpenLoginContext>({
  userInfo: null,
  sdk: undefined,
})

export const OpenLoginProvider = ({ clientId, children }: IOpenLoginProviderProps) => {
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | null>(null);
  const [sdk, setSDK] = useState<IOpenLoginSDK>();
  // TODO: usePropsRefs
  const optionsRef = useRef<IOpenLoginOptions>({ clientId })
  
  useEffect(() => {    
    const sdk = new SDK();

    const onLoginStateChanged = async (isLoggedIn: boolean) => {
      let userInfo: Partial<UserInfo> | null = null;

      if (isLoggedIn) {
        userInfo = await sdk.getUserInfo();        
      }      

      setUserInfo(userInfo);
    }

    const initializeSDK = async () => {      
      const options = { ...optionsRef.current, onLoginStateChanged }
      
      await sdk.initialize(options);
      setSDK(sdk);
    }
    
    initializeSDK();
  }, [setUserInfo, setSDK]);

  if (!sdk) {
    return null;
  }

  return (
    <OpenLoginContext.Provider value={{ userInfo, sdk }}>
      {children}
    </OpenLoginContext.Provider>
  );
}

export const useOpenLogin = (): IOpenLoginHook => {
  const { sdk, userInfo } = useContext(OpenLoginContext);
  const logout = useCallback(async () => sdk!.logout(), [sdk]);
  const login = useCallback(async () => sdk!.login(), [sdk]);
  const { isLoggedIn } = sdk!;

  return { isLoggedIn, userInfo, login, logout };
}

export const useEthersRPC = (): IEthersRPCHook => {
  const { sdk } = useContext(OpenLoginContext);
  const getChainId = useCallback(async () => sdk!.getChainId(), [sdk]);
  const getAccounts = useCallback(async () => sdk!.getAccounts(), [sdk]);
  const getBalance = useCallback(async () => sdk!.getBalance(), [sdk]);
  const getPrivateKey = useCallback(async () => sdk!.getPrivateKey(), [sdk]);
  
  const signMessage = useCallback(async (originalMessage: string) => {
    return sdk!.signMessage(originalMessage);
  }, [sdk]);

  const sendTransaction = useCallback(async (destination: string, amount: number) => {
    return sdk!.sendTransaction(destination, amount);
  }, [sdk]);

  return {
    getChainId,
    getAccounts,
    getBalance,
    getPrivateKey,
    signMessage,
    sendTransaction,
  };
}
