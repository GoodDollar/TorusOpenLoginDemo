import {
  Chain,
  EIP1193Provider,
  ProviderAccounts,
  WalletInit,
  createEIP1193Provider, 
  ProviderRpcError, 
  ProviderRpcErrorCode
} from '@web3-onboard/common';
import type EventEmitter from 'eventemitter3';
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base'
import { IOpenLoginSDK } from '../../openlogin/types';

const { EIP155, OTHER } = CHAIN_NAMESPACES;

const OPENLOGIN_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 128 128" fill="none"><script xmlns="" type="text/javascript"/>
  <circle cx="64.6887" cy="64.6882" r="59.1828" fill="#0364FF"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M88.8746 85.5612C88.474 87.056 86.353 87.056 85.9524 85.5612L81.2873 68.1506C81.1971 67.8139 81.1971 67.4595 81.2873 67.1229L85.4214 51.694C85.7869 50.3301 87.0229 49.3817 88.4349 49.3817H94.5031C96.5544 49.3817 98.0475 51.3275 97.5165 53.309L88.8746 85.5612ZM48.8481 68.1215C48.9383 67.7849 48.9383 67.4305 48.8481 67.0938L44.7217 51.694C44.3562 50.3301 43.1203 49.3817 41.7082 49.3817H35.6401C33.5887 49.3817 32.0956 51.3275 32.6266 53.309L41.2607 85.5321C41.6613 87.0269 43.7824 87.0269 44.1829 85.5321L48.8481 68.1215Z" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M61.9907 89.069C61.854 89.5793 62.2385 90.0805 62.7669 90.0805H67.3947C67.9231 90.0805 68.3077 89.5793 68.1709 89.069L65.857 80.4334C65.6442 79.6392 64.5174 79.6392 64.3046 80.4334L61.9907 89.069Z" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M57.3829 94.5979C57.0285 95.9205 55.83 96.8402 54.4607 96.8402H48.1968C46.2076 96.8402 44.7598 94.9533 45.2747 93.0319L58.1248 45.0747C58.5124 43.6281 59.8233 42.6222 61.3209 42.6222H68.7757C70.2733 42.6222 71.5842 43.6281 71.9718 45.0747L84.822 93.0319C85.3368 94.9533 83.889 96.8402 81.8998 96.8402H75.6359C74.2666 96.8402 73.0681 95.9205 72.7137 94.5979L66.4637 71.2726C66.0757 69.8245 64.0209 69.8245 63.6329 71.2726L57.3829 94.5979Z" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M88.8909 85.5612C88.4903 87.056 86.3692 87.056 85.9687 85.5612L81.3035 68.1506C81.2133 67.8139 81.2133 67.4595 81.3035 67.1229L87.2489 44.9345C87.6144 43.5706 88.8503 42.6222 90.2624 42.6222H96.3305C98.3819 42.6222 99.8749 44.568 99.344 46.5494L88.8909 85.5612ZM48.8643 68.1215C48.9545 67.7849 48.9545 67.4305 48.8643 67.0938L42.9268 44.9345C42.5613 43.5706 41.3253 42.6222 39.9133 42.6222H33.8451C31.7938 42.6222 30.3007 44.568 30.8317 46.5494L41.277 85.5321C41.6776 87.0269 43.7986 87.0269 44.1992 85.5321L48.8643 68.1215Z" fill="white"/>
</svg>
`

const connectTo = async (sdk: IOpenLoginSDK, chain: Chain): Promise<SafeEventEmitterProvider> => {
  const { rpcUrl, namespace, id, token, label } = chain;

  await sdk.configure({
    chain: {
      ticker: token,
      tickerName: label,
      chainId: id,
      rpcTarget: rpcUrl,
      chainNamespace: namespace === 'evm' ? EIP155 : OTHER
    }
  });

  if (!sdk.isLoggedIn) {
    await sdk.login();
  }

  return <SafeEventEmitterProvider>sdk.provider;
};

const makeProvider = (sdk: IOpenLoginSDK, emitter: EventEmitter, chains: Chain[]): EIP1193Provider => {
  const provider = createEIP1193Provider(sdk.provider, {
    eth_selectAccounts: null,
    eth_requestAccounts: async ({ baseRequest }) => {
      try {
        const accounts = await baseRequest({
          method: 'eth_accounts'
        });

        return accounts as ProviderAccounts
      } catch (error) {
        console.error(error);

        throw new ProviderRpcError({
          code: ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED,
          message: 'Account access rejected'
        })
      }
    },

    wallet_switchEthereumChain: async ({ params }) => {
      const chain = chains.find(({ id }) => id === params[0].chainId);

      if (!chain) {
        throw new Error('Chain must be set before switching');
      }

      await connectTo(sdk, chain);
      emitter.emit('chainChanged', chain.id);

      return null
    }
  });

  provider.on = emitter.on.bind(emitter);
  provider.disconnect = () => sdk.logout();

  return provider;
}

export function openlogin(sdk: IOpenLoginSDK): WalletInit {
  return () => ({
    label: 'Web3Auth',
    getIcon: async () => OPENLOGIN_ICON,
    getInterface: async ({ EventEmitter, chains }) => {
      await connectTo(sdk, chains[0]);
      
      const emitter = new EventEmitter();
      const provider = makeProvider(sdk, emitter, chains);

      emitter.on('chainChanged', () => {
        const newChainProvider = makeProvider(sdk, emitter, chains);

        provider.request = newChainProvider.request.bind(newChainProvider)

        // @ts-ignore - bind old methods for backwards compat
        provider.send = newChainProvider.send.bind(newChainProvider)

        // @ts-ignore - bind old methods for backwards compat
        provider.sendAsync = newChainProvider.sendAsync.bind(newChainProvider)
      });

      return {
        provider,
        instance: sdk.auth,
      };
    }
  })
}
