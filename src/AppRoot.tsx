import React from "react";
import App from "./App";
import { NativeBaseProvider, extendTheme } from "native-base";
import { OpenLoginProvider } from "./openlogin";
import { OnboardProvider } from "./onboard";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
  },
});

// extend the theme
type MyThemeType = typeof theme;
declare module "native-base" {
  interface ICustomTheme extends MyThemeType {}
}

const AppRoot = () => (
  <NativeBaseProvider theme={theme}>
    <OpenLoginProvider 
      clientId="BAS1hxL_eicnbgmw4AVY3V2VL98fLivRouaOszzA_sDs6GV-MyGk_Sv-qHUPNSK801UMKsyU1t1xmcCneWx0-VQ"
      googleClientId="116029009779-p67pragfd05ljt66nqq2rvnsune8g4j8.apps.googleusercontent.com"
      verifier="gooddollar-google-testnet"
      appName="GoodSwap"
      appLogo="https://goodswap.xyz/static/media/logo.1fb143e9.png"
    >
      <OnboardProvider>
        <App />
      </OnboardProvider>
    </OpenLoginProvider>
  </NativeBaseProvider>
);

export default AppRoot;
