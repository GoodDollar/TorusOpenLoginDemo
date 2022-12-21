import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { UserInfo, CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { IOpenLoginOptions, IOpenLoginSDK } from "./types";

class OpenLoginWebSDK implements IOpenLoginSDK {
  private auth!: Web3Auth;
  private provider!: SafeEventEmitterProvider | null;
  private eth!: ethers.providers.Web3Provider | null;
  private listener!: IOpenLoginOptions["onLoginStateChanged"] | null;

  get initialized(): boolean {
    return !!this.auth;
  }

  get isLoggedIn(): boolean {
    return !!this.provider;
  }

  async initialize({ clientId, onLoginStateChanged }: IOpenLoginOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    const auth = new Web3Auth({
      clientId,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xa4ec",
        rpcTarget: "https://rpc.ankr.com/celo", // This is the public RPC we have added, please pass on your own endpoint while creating an app
      },
    });   

    await auth.initModal();
    this.auth = auth;
    
    if (onLoginStateChanged) {
      this.listener = onLoginStateChanged;
    }

    const { provider } = auth

    this.setProvider(provider || null);
  }

  async login(): Promise<void> {
    this.assertInitialized();

    if (this.isLoggedIn) {
      return;
    }
    
    const provider = await this.auth.connect();
    
    this.setProvider(provider);
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {    
    this.assertInitialized();

    return this.auth.getUserInfo();
  }

  async logout(): Promise<void> {
    this.assertInitialized();

    if (!this.isLoggedIn) {
      return;
    }

    await this.auth.logout();
    this.setProvider(null);
  }

  async getChainId(): Promise<any> {
    this.assertLogin();

    // Get the connected Chain's ID
    const networkDetails = await this.eth!.getNetwork();
    
    return networkDetails.chainId;    
  }

  async getAccounts(): Promise<any> {
    this.assertLogin();

    const signer = this.eth!.getSigner();
    
    // Get user's Ethereum public address
    return signer.getAddress();  
  }

  async getBalance(): Promise<string> {
    this.assertLogin();

    const signer = this.eth!.getSigner();    
    // Get user's Ethereum public address
    const address = await signer.getAddress();
    // Balance is in wei
    const balance = await this.eth!.getBalance(address) 
    
    // Get user's balance in ether
    return ethers.utils.formatEther(balance);
  }

  async sendTransaction(destination: string, amount: number): Promise<any> {
    this.assertLogin();

    const signer = this.eth!.getSigner();
    const parsedAmount = ethers.utils.parseEther(String(amount));

    // Submit transaction to the blockchain
    const tx = await signer.sendTransaction({
      to: destination,
      value: parsedAmount,
      maxPriorityFeePerGas: "5000000000", // Max priority fee per gas
      maxFeePerGas: "6000000000000", // Max fee per gas
    });

    // Wait for transaction to be mined
    return tx.wait();  
  }

  async signMessage(originalMessage: string): Promise<any> {
    this.assertLogin();

    const signer = this.eth!.getSigner();

    // Sign the message
    return signer.signMessage(originalMessage);
  }

  async getPrivateKey(): Promise<any> {
    this.assertLogin();
    
    return this.provider!.request({
      method: "eth_private_key",
    })
  }

  private setProvider(provider: SafeEventEmitterProvider | null) {
    const { listener } = this;
    let eth: ethers.providers.Web3Provider | null = null;
    
    if (provider) {
      eth = new ethers.providers.Web3Provider(provider);    
    }
    
    this.provider = provider;
    this.eth = eth;

    if (listener) {
      listener(!!provider);
    }
  }

  private assertInitialized() {
    if (!this.auth) {
      throw new Error('Open login SDK not initialized');
    }
  }
  
  private assertLogin() {
    if (!this.provider) {
      throw new Error('User signed out');
    }
  }
}

export default OpenLoginWebSDK;
