import { UserInfo } from "@web3auth/base";

export interface IOpenLoginOptions {
  clientId: string;
  onLoginStateChanged?: (isLoggedIn: boolean) => void; // go with one callback by now, could be moved to EE in the future if many other events would appear
}

export interface IOpenLoginSDK {
  readonly initialized: boolean;
  readonly isLoggedIn: boolean;
  initialize(options: IOpenLoginOptions): Promise<void>;
  login(): Promise<void>;
  getUserInfo(): Promise<Partial<UserInfo>>;
  logout(): Promise<void>;
  getChainId(): Promise<any>;
  getAccounts(): Promise<any>;
  getBalance(): Promise<string>;
  sendTransaction(destination: string, amount: number): Promise<any>;
  signMessage(originalMessage: string): Promise<any>;
  getPrivateKey(): Promise<any>;
}
