import { UserInfo } from "@web3auth/base";
import { useColorMode, useColorModeValue } from "native-base";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { noop } from "lodash";
import { OpenLoginSDK } from "./sdk";
import { IOpenLoginContext, IOpenLoginCustomization, IOpenLoginHook, IOpenLoginOptions, IOpenLoginProviderProps, IOpenLoginSDK, SDKEvent } from "./types";

export const OpenLoginContext = createContext<IOpenLoginContext>({
  userInfo: null,
  sdk: undefined,
})

export const OpenLoginProvider = ({ 
  // login opts
  clientId, 
  googleClientId, 
  verifier, 
  network = "testnet", 
  // app opts
  appName,
  appLogo,
  locale = "en",    
  // generic react props
  children 
}: IOpenLoginProviderProps) => {
  const { colorMode } = useColorMode();
  const primaryColor = useColorModeValue("primary.50", "primary.800");
  const [userInfo, setUserInfo] = useState<Partial<UserInfo> | null>(null);
  const [sdk, setSDK] = useState<IOpenLoginSDK>();
  const initiallyCustomizedRef = useRef<boolean>(false);

  const customization: IOpenLoginCustomization = useMemo(() => ({
    appName,
    appLogo,
    locale,
    primaryColor,
    darkMode: colorMode === "dark",
  }), [appName, appLogo, locale, primaryColor, colorMode]);
  
  const optionsRef = useRef<IOpenLoginOptions>({ 
    clientId, 
    network, 
    googleClientId, 
    verifier,
    ...customization,
  })
  
  useEffect(() => {    
    const sdk = new OpenLoginSDK();
    const { LoginStateChanged } = SDKEvent;

    const onLoginStateChanged = async (isLoggedIn: boolean) => {
      let userInfo: Partial<UserInfo> | null = null;

      if (isLoggedIn) {
        userInfo = await sdk.getUserInfo();        
      }      

      setUserInfo(userInfo);
    }

    const initializeSDK = async () => {      
      await sdk.initialize(optionsRef.current);
      setSDK(sdk);
    }

    sdk.addEventListener(LoginStateChanged, onLoginStateChanged);    
    initializeSDK();

    return () => {
      sdk.removeEventListener(LoginStateChanged, onLoginStateChanged);    
    }
  }, [setUserInfo, setSDK]);

  useEffect(() => {
    if (initiallyCustomizedRef.current) {
      // if flag enabled - update customization
      sdk?.customize(customization).catch(noop);
    } else if (sdk) {
      // once SDK initialized - enable flag to start updaing from the next render
      initiallyCustomizedRef.current = true;
    }

    // while sdk not initialized - do nothing
  }, [sdk, customization]);

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
