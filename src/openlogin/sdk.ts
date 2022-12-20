import { Web3Auth } from "@web3auth/modal";
import { UserInfo, CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { IOpenLoginOptions, IOpenLoginSDK } from "./types";

class OpenLoginWebSDK implements IOpenLoginSDK {
  private auth!: Web3Auth;
  private provider!: SafeEventEmitterProvider | null;
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

    if (provider) {
      this.provider = provider;
    }    

    this.emitLoginStateChanged();
  }

  async login(): Promise<void> {
    this.assertInitialized();

    if (this.isLoggedIn) {
      return;
    }
    
    this.provider = await this.auth.connect();
    this.emitLoginStateChanged();
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
    this.provider = null;
    this.emitLoginStateChanged();
  }

  private emitLoginStateChanged() {
    const { listener, isLoggedIn } = this;

    if (listener) {
      listener(isLoggedIn);
    }
  }

  private assertInitialized() {
    if (!this.auth) {
      throw new Error('Open login SDK not initialized');
    }
  }
  /*
  private assertLogin() {
    if (!this.provider) {
      throw new Error('User signed out');
    }
  }*/
}

export default OpenLoginWebSDK;
