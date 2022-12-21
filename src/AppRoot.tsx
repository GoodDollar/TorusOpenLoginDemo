import React from "react";
import App from "./App";
import { NativeBaseProvider, extendTheme } from "native-base";
import { OpenLoginProvider } from "./openlogin";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
  },
});

// extend the theme
type MyThemeType = typeof theme;
declare module "native-base" {
  interface ICustomTheme extends MyThemeType {}
}

const AppRoot = () => (
  <NativeBaseProvider theme={theme}>
    <OpenLoginProvider clientId="BAS1hxL_eicnbgmw4AVY3V2VL98fLivRouaOszzA_sDs6GV-MyGk_Sv-qHUPNSK801UMKsyU1t1xmcCneWx0-VQ">
      <App />
    </OpenLoginProvider>
  </NativeBaseProvider>
);

export default AppRoot;
