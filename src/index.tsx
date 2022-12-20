import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { NativeBaseProvider, extendTheme } from "native-base";
import reportWebVitals from "./reportWebVitals";
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

ReactDOM.render(
  <React.StrictMode>
    <NativeBaseProvider theme={theme}>
      <OpenLoginProvider clientId="BAS1hxL_eicnbgmw4AVY3V2VL98fLivRouaOszzA_sDs6GV-MyGk_Sv-qHUPNSK801UMKsyU1t1xmcCneWx0-VQ">
        <App />
      </OpenLoginProvider>
    </NativeBaseProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
