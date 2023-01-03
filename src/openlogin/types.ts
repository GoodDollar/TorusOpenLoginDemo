import { SafeEventEmitterProvider, UserInfo } from "@web3auth/base";
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";

export enum SDKEvent {
  LoginStateChanged = "loginStatusChanged",
  ConfigChanged = "configChanged",
  Error = "error"
}

export interface IOpenLoginCustomization {
  appName?: string;
  appLogo?: string;
  locale?: "en" | "de" | "ja" | "ko" | "zh" | "es";
  primaryColor?: string;
  darkMode?: boolean;
}

export interface IOpenLoginOptions extends IOpenLoginCustomization {
  clientId: string;
  googleClientId: string;
  verifier: string;
  network?: OPENLOGIN_NETWORK_TYPE;  
  chain?: Web3AuthCoreOptions["chainConfig"];
}

export type IOpenLoginBCOptions = Pick<IOpenLoginOptions, "network" | "chain">;

export interface IOpenLoginSDK {
  readonly initialized: boolean;
  readonly isLoggedIn: boolean;
  readonly auth: Web3AuthCore | null;
  readonly provider: SafeEventEmitterProvider | null;
  initialize(options: IOpenLoginOptions): Promise<void>;
  configure(blockchain: IOpenLoginBCOptions): Promise<void>;
  customize(customization: IOpenLoginCustomization): Promise<void>;
  login(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  logout(): Promise<void>;
  addEventListener(event: SDKEvent, listener: (...args: any[]) => void): void;
  removeEventListener(event: SDKEvent, listener: (...args: any[]) => void): void;
}

export type IOpenLoginProviderProps = Omit<IOpenLoginOptions, 
  "onLoginStateChanged" | 
  "darkMode" | 
  "primaryColor"
> & {
  children?: any;
}

export interface IOpenLoginContext {
  userInfo: Partial<UserInfo> | null;
  sdk: IOpenLoginSDK | undefined;
}

export type IOpenLoginHook = Pick<IOpenLoginSDK, 
  "isLoggedIn" | 
  "login" | 
  "logout" 
> & {
  userInfo: Partial<UserInfo> | null; 
};
