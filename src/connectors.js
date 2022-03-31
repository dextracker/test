import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { LedgerConnector } from '@web3-react/ledger-connector';
import { TrezorConnector } from '@web3-react/trezor-connector';
import { FrameConnector } from '@web3-react/frame-connector';

const POLLING_INTERVAL = 12000;
export const RPC_URLS = {
  250: 'https://rpc.ftm.tools/',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
};

export const injected = new InjectedConnector({
  supportedChainIds: [250, 43114],
  defaultChainId: 250,
});

export const network = new NetworkConnector({
  urls: { 250: RPC_URLS[250], 43114: RPC_URLS[43114] },
  defaultChainId: 43114,
  pollingInterval: POLLING_INTERVAL,
});

export const walletconnect = new WalletConnectConnector({
  rpc: { 1: RPC_URLS[1] },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
});

export const ledger = new LedgerConnector({
  chainId: 1,
  url: RPC_URLS[1],
  pollingInterval: POLLING_INTERVAL,
});

export const trezor = new TrezorConnector({
  chainId: 1,
  url: RPC_URLS[1],
  pollingInterval: POLLING_INTERVAL,
  manifestEmail: 'dummy@abc.xyz',
  manifestAppUrl: 'https://8rg3h.csb.app/',
});

export const frame = new FrameConnector({ supportedChainIds: [250] });
