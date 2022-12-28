import { ethers } from "ethers";
import { Web3AuthCore } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";
import TorusEmbed from "@toruslabs/torus-embed";
import EventEmitter from "eventemitter3";
import { UserInfo, CHAIN_NAMESPACES, ADAPTER_STATUS, WALLET_ADAPTERS, SafeEventEmitterProvider, ADAPTER_EVENTS } from "@web3auth/base";
import { IOpenLoginOptions, IOpenLoginSDK, SDKEvent } from "./types";

class OpenLoginWebSDK implements IOpenLoginSDK {
  private auth!: Web3AuthCore;  
  private eth!: ethers.providers.Web3Provider | null;
  private adapter!: OpenloginAdapter;
  private plugin!: TorusWalletConnectorPlugin;
  private emitter = new EventEmitter();

  get initialized(): boolean {
    return !!this.auth;
  }

  get isLoggedIn(): boolean {
    return this.auth.status === ADAPTER_STATUS.CONNECTED && !!this.provider;
  }

  private get provider(): SafeEventEmitterProvider | null {
    return this.auth.provider;
  }

  private get wallet(): TorusEmbed | null {
    return this.plugin.torusWalletInstance;
  }

  async initialize({ 
    // login opts
    clientId, 
    googleClientId, 
    verifier, 
    network = 'testnet',     
    // app opts
    appName,
    appLogo,
    locale = "en",    
    // theme opts
    primaryColor,  
    darkMode = false
  }: IOpenLoginOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    const auth = new Web3AuthCore({      
      clientId,
      web3AuthNetwork: network,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xa4ec",
        rpcTarget: "https://rpc.ankr.com/celo", // This is the public RPC we have added, please pass on your own endpoint while creating an app
      },
    });   

    const colors = {
      primary: primaryColor || "#00a8ff",
    }

    const logo = {
      logoDark: appLogo || "https://web3auth.io/images/w3a-L-Favicon-1.svg",
      logoLight: appLogo || "https://web3auth.io/images/w3a-D-Favicon-1.svg",
    }

    const adapter = new OpenloginAdapter({
      adapterSettings: {
        uxMode: "popup",
        loginConfig: {
          jwt: {
            verifier,
            typeOfLogin: "jwt",
            clientId: googleClientId,
          },
        },
        whiteLabel: {
          name: appName,
          dark: darkMode,
          defaultLanguage: locale,          
          theme: colors,
          ...logo,
        },        
      },
    });

    const plugin = new TorusWalletConnectorPlugin({
      torusWalletOpts: {},
      walletInitOptions: {
        showTorusButton: false,
        useWalletConnect: true,
        whiteLabel: {
          theme: { isDark: darkMode, colors },
          ...logo,
        },                
      },
    })
    
    auth.configureAdapter(adapter);
    await auth.addPlugin(plugin);
    await auth.init();

    this.auth = auth;
    this.adapter = adapter;
    this.plugin = plugin;

    const { CONNECTED, DISCONNECTED } = ADAPTER_EVENTS;
    const eventListener = this.onLoginStateChanged.bind(this);
    
    for (const event of [CONNECTED, DISCONNECTED]) {
      auth.on(event, eventListener);
    }       
  }

  async login(): Promise<void> {
    this.assertInitialized();

    if (this.isLoggedIn) {
      return;
    }
    
    await this.auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "google",
    });
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

  addEventListener(event: SDKEvent, listener: (...args: any[]) => void): void {
    this.emitter.addListener(event, listener);
  }

  removeEventListener(event: SDKEvent, listener: (...args: any[]) => void): void {
    this.emitter.removeListener(event, listener);
  }

  private onLoginStateChanged() {
    const { isLoggedIn, provider, wallet } = this;
    let eth: ethers.providers.Web3Provider | null = null;
      
    if (isLoggedIn && wallet?.torusWidgetVisibility) {
      wallet?.hideTorusButton();
    }
    
    if (provider) {
      eth = new ethers.providers.Web3Provider(provider!);    
    }
    
    this.eth = eth;
    this.emitter.emit(SDKEvent.LoginStateChanged, isLoggedIn);    
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
