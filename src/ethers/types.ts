export interface IEthersRPC {
  getChainId(): Promise<any>;
  getAccounts(): Promise<any>;
  getBalance(): Promise<string | undefined | null>;
  sendTransaction(destination: string, amount: number): Promise<any>;
  signMessage(originalMessage: string): Promise<any>;
  getPrivateKey(): Promise<any>;
}
