import { ADAPTER_EVENTS, SafeEventEmitterProvider } from "@web3auth/base";
import { BigNumberish, ethers } from "ethers";
import { pick, values } from 'lodash';
import { IEthersRPC } from "./types";

export class EthersRPC implements IEthersRPC {
  private eth!: ethers.providers.Web3Provider;
  
  constructor (private provider: SafeEventEmitterProvider) {
    this.eth = new ethers.providers.Web3Provider(provider);
  }

  async getChainId(): Promise<any> {
    // Get the connected Chain's ID
    const networkDetails = await this.eth.getNetwork();
    
    return networkDetails.chainId;    
  }

  async getAccounts(): Promise<any> {
    const signer = this.eth.getSigner();
    
    // Get user's Ethereum public address
    return signer.getAddress();  
  }

  async getBalance(): Promise<string | undefined | null> {
    const { eth } = this    
    const signer = eth.getSigner();    
    // Get user's Ethereum public address
    const address = await signer.getAddress();
    // Balance is in wei
    const balance = await eth.getBalance(<string>address);
    
    // Get user's balance in ether
    return ethers.utils.formatEther(<BigNumberish>balance);
  }

  async sendTransaction(destination: string, amount: number): Promise<any> {
    const signer = this.eth.getSigner();
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
    const signer = this.eth.getSigner();

    // Sign the message
    return signer.signMessage(originalMessage);
  }

  async getPrivateKey(): Promise<any> {
    return this.provider.request({
      method: "eth_private_key",
    })
  }
}
