import { WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import TorusEmbed, { WhiteLabelParams } from "@toruslabs/torus-embed";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CHAIN_NAMESPACES, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3AuthCore, Web3AuthCoreOptions } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";
import EventEmitter from "eventemitter3";
import { bindAll, pick, values } from 'lodash';
import { IOpenLoginBCOptions, IOpenLoginCustomization, IOpenLoginOptions, IOpenLoginSDK, SDKEvent } from "./types";

const subscribeTo = values(pick(ADAPTER_EVENTS, 'CONNECTED', 'DISCONNECTED'));
const defaultChain: IOpenLoginOptions["chain"] = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xa4ec",
  rpcTarget: "https://alfajores-forno.celo-testnet.org", 
};

export class OpenLoginSDK implements IOpenLoginSDK {
  private coreAuth!: Web3AuthCore | null;  
  private adapter!: OpenloginAdapter | null;
  private plugin!: TorusWalletConnectorPlugin | null;
  private options!: IOpenLoginOptions;
  private emitter = new EventEmitter();

  get auth(): Web3AuthCore | null {
    return this.coreAuth;
  }

  get initialized(): boolean {
    return !!this.auth;
  }

  get isLoggedIn(): boolean {
    return this.auth?.status === ADAPTER_STATUS.CONNECTED && !!this.provider;
  }

  get provider(): SafeEventEmitterProvider | null {
    return this.auth?.provider || null;
  }

  private get wallet(): TorusEmbed | null {
    return this.plugin?.torusWalletInstance || null;
  }

  constructor() {
    bindAll(this, 'onLoginStateChanged');
  }

  async initialize(options: IOpenLoginOptions): Promise<void> {    
    if (this.initialized) {
      return;
    }

    const { 
      // login opts
      clientId, 
      googleClientId, 
      verifier, 
      network = 'testnet',  
      chain = defaultChain,   
       // customization opts
       ...customization
    } = options;

    const auth = new Web3AuthCore({      
      clientId,
      web3AuthNetwork: network,
      chainConfig: <Web3AuthCoreOptions["chainConfig"]>chain,
    });

    const whiteLabel = this.prepareWhitelabel(customization);

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
        whiteLabel: whiteLabel.adapter,
      },
    });

    const plugin = new TorusWalletConnectorPlugin({
      torusWalletOpts: {},
      walletInitOptions: {
        whiteLabel: whiteLabel.plugin,                
      },
    });
    
    auth.configureAdapter(adapter);
    await auth.addPlugin(plugin);
    await auth.init();

    this.coreAuth = auth;
    this.adapter = adapter;
    this.plugin = plugin;  
    this.options = options;
    
    for (const event of subscribeTo) {
      auth.on(event, this.onLoginStateChanged);
    }       
  }

  async configure(blockchain: IOpenLoginBCOptions): Promise<void> {
    const { options } = this;

    await this.reconfigure({ ...options, ...blockchain });
  }

  async customize(customization: IOpenLoginCustomization): Promise<void> {
    const { options } = this;

    await this.reconfigure({ ...options, ...customization });
  }

  async login(): Promise<void> {
    this.assertInitialized();

    if (this.isLoggedIn) {
      return;
    }
    
    await this.auth?.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "google",
    });
  }

  async getUserInfo(): Promise<Partial<UserInfo>> {    
    this.assertInitialized();

    const userInfo = await this.auth?.getUserInfo();

    return userInfo || {};
  }

  async logout(): Promise<void> {
    this.assertInitialized();

    if (!this.isLoggedIn) {
      return;
    }

    await this.auth?.logout();    
  }

  addEventListener(event: SDKEvent, listener: (...args: any[]) => void): void {
    this.emitter.addListener(event, listener);
  }

  removeEventListener(event: SDKEvent, listener: (...args: any[]) => void): void {
    this.emitter.removeListener(event, listener);
  }

  private async reconfigure(options: IOpenLoginOptions): Promise<void> {
    const { adapter, auth } = this;

    this.assertInitialized();
    await adapter?.openloginInstance?._cleanup();

    for (const event of subscribeTo) {
      auth?.off(event, this.onLoginStateChanged);
    }

    this.coreAuth = null;
    this.adapter = null;
    this.plugin = null; 
    
    await this.initialize(options);
    this.emitter.emit(SDKEvent.ConfigChanged);
  }

  private onLoginStateChanged() {
    const { isLoggedIn, wallet } = this;
      
    if (isLoggedIn && wallet?.torusWidgetVisibility) {
      wallet?.hideTorusButton();
    }
    
    this.emitter.emit(SDKEvent.LoginStateChanged, isLoggedIn);    
  }

  private prepareWhitelabel({
    // app opts
    appName,
    appLogo,
    locale = "en",    
    // theme opts
    primaryColor,  
    darkMode = false
  }: IOpenLoginCustomization): { 
    adapter: WhiteLabelData; 
    plugin: WhiteLabelParams; 
  } {
    const colors = {
      primary: primaryColor || "#00a8ff",
    }

    const logo = {
      logoDark: appLogo || "https://web3auth.io/images/w3a-L-Favicon-1.svg",
      logoLight: appLogo || "https://web3auth.io/images/w3a-D-Favicon-1.svg",
    }

    const adapter: WhiteLabelData = {
      name: appName,
      dark: darkMode,
      defaultLanguage: locale,          
      theme: colors,
      ...logo,
    }

    const plugin: WhiteLabelParams = {
      theme: { isDark: darkMode, colors },
      ...logo,
    };
    
    return { adapter, plugin };
  }

  private assertInitialized() {
    if (!this.auth) {
      throw new Error('Open login SDK not initialized');
    }
  }  
}
