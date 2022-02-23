import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useENSName } from 'use-ens-name';
import { Provider } from 'react-redux';
import {
  Web3ReactProvider,
  useWeb3React,
  UnsupportedChainIdError,
} from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import {
  URI_AVAILABLE,
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
} from '@web3-react/walletconnect-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from '@web3-react/frame-connector';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';

import { injected, network, walletconnect, ledger, trezor } from './connectors';
import { useEagerConnect, useInactiveListener } from './hooks';
import { Spinner } from './Spinner';
import { Orders, CreateOrder } from './Order';
import { ethers } from 'ethers';
import { SCAC } from './contracts/contractWrappers/SCAC';

const connectorsByName = {
  Injected: injected,
  Network: network,
  WalletConnect: walletconnect,
  Ledger: ledger,
  Trezor: trezor,
};
const injectedByName = {
  Injected: injected,
};

function getErrorMessage(error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return 'Please authorize this website to access your Ethereum account.';
  } else {
    console.error(error);
    return 'An unknown error occurred. Check the console for more details.';
  }
}

async function switchProviderToAvax() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ethers.utils.hexlify(43114) }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ethers.utils.hexlify(43114),
              chainName: 'Avalanche Mainnet',
              rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'] /* ... */,
            },
          ],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }
}
async function switchProviderToFtm() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ethers.utils.hexlify(250) }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ethers.utils.hexlify(250),
              chainName: 'Fantom Mainnet',
              rpcUrls: ['https://rpc.ftm.tools/'] /* ... */,
            },
          ],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <MyComponent key={'mainApp'} />
    </Web3ReactProvider>
  );
}

const EnsName = ({ address }) => {
  const name = useENSName(address);

  return <div>{name}</div>;
};

function MyComponent() {
  const context = useWeb3React();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error,
  } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState();
  React.useEffect(() => {
    console.log('running');
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  // set up block listener
  const [blockNumber, setBlockNumber] = React.useState();
  console.log(blockNumber);
  React.useEffect(() => {
    console.log('running');
    if (library) {
      let stale = false;

      console.log('fetching block number!!');
      library
        .getBlockNumber()
        .then((blockNumber) => {
          if (!stale) {
            setBlockNumber(blockNumber);
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null);
          }
        });

      const updateBlockNumber = (blockNumber) => {
        setBlockNumber(blockNumber);
      };
      library.on('block', updateBlockNumber);

      return () => {
        library.removeListener('block', updateBlockNumber);
        stale = true;
        setBlockNumber(undefined);
      };
    }
  }, [library, chainId]);

  // fetch eth balance of the connected account
  const [ethBalance, setEthBalance] = React.useState();
  React.useEffect(() => {
    console.log('running');
    if (library && account) {
      let stale = false;

      library
        .getBalance(account)
        .then((balance) => {
          if (!stale) {
            setEthBalance(balance);
          }
        })
        .catch(() => {
          if (!stale) {
            setEthBalance(null);
          }
        });

      return () => {
        stale = true;
        setEthBalance(undefined);
      };
    }
  }, [library, account, chainId]);

  // log the walletconnect URI
  React.useEffect(() => {
    console.log('running');
    const logURI = (uri) => {
      console.log('WalletConnect URI', uri);
    };
    walletconnect.on(URI_AVAILABLE, logURI);

    return () => {
      walletconnect.off(URI_AVAILABLE, logURI);
    };
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1
        style={{
          margin: '0',
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '0.5fr 3fr 1fr',
        }}
      >
        {/* {active ? '🟢' : error ? '🔴' : '🟠'} */}
        {/* </h1> */}
        {/* wallet connector */}
        {/* <h3
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '0.5fr min-content 1fr 1fr',
          maxWidth: '20rem',
          lineHeight: '2rem',
          margin: 'auto',
          textAlign: 'right',
        }}
      > */}
        {Object.keys(injectedByName).map((name) => {
          const currentConnector = connectorsByName[name];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled =
            !triedEager || !!activatingConnector || connected || !!error;
          let btnStyle;
          if (chainId === 43114) {
            btnStyle = 'btn-avax';
          }
          if (chainId === 250) {
            btnStyle = 'btn-ftm';
          }
          if (chainId === undefined || 0 || null) {
            btnStyle = 'btn-grad';
          }
          return (
            <>
              <img
                src="https://uploads.codesandbox.io/uploads/user/ec99cf90-9270-41c2-9b72-7cb10eee778e/WSE8-FlyWheelLogo2.png"
                alt="logo"
                style={{
                  width: '5em',
                  heigh: '5em',
                }}
              />
              <div
                style={{
                  width: '',
                  height: '5em',
                  backgroundColor: 'red',
                  float: 'center',
                  margin: 'auto',
                }}
              />
              {!!(error && !active) && (
                <>
                  <div style={{ float: 'right' }}>
                    <button
                      className={'btn-ftm'}
                      style={{
                        height: '5rem',
                        width: 'max-content',
                        borderRadius: '1rem',
                        cursor: disabled ? 'unset' : 'pointer',
                        position: 'relative',
                      }}
                      key={'switchProviderToFtm'}
                      onClick={async () => {
                        console.log(await currentConnector.getChainId());
                        await switchProviderToFtm();
                        setActivatingConnector(currentConnector);
                        activate(connectorsByName[name]);
                      }}
                    >
                      Switch to Ftm
                    </button>
                    <button
                      className={'btn-avax'}
                      style={{
                        height: '5rem',
                        width: 'max-content',
                        borderRadius: '1rem',
                        cursor: disabled ? 'unset' : 'pointer',
                        position: 'relative',
                        float: 'right',
                      }}
                      key={'switchProviderToAvax'}
                      onClick={async () => {
                        console.log('here');
                        await switchProviderToAvax();
                        setActivatingConnector(currentConnector);
                        activate(connectorsByName[name]);
                      }}
                    >
                      Switch to Avax
                    </button>
                  </div>
                </>
              )}
              {(chainId === 250 || 43314) && !connected && (
                <div style={{ float: 'right' }}>
                  <button
                    className={btnStyle}
                    style={{
                      height: '5rem',
                      width: 'max-content',
                      borderRadius: '1rem',
                      cursor: disabled ? 'unset' : 'pointer',
                      position: 'relative',
                    }}
                    disabled={disabled}
                    key={'connect wallet button'}
                    onClick={() => {
                      setActivatingConnector(currentConnector);
                      activate(connectorsByName[name]);
                    }}
                  >
                    {!connected && 'Please Connect Your Wallet'}
                  </button>
                </div>
              )}
              {active && connected && (
                <>
                  <div style={{ float: 'right' }}>
                    <button
                      className={btnStyle}
                      style={{
                        height: '5rem',
                        width: 'max-content',
                        borderRadius: '1rem',
                        cursor: disabled ? 'unset' : 'pointer',
                        position: 'relative',
                      }}
                      disabled={disabled}
                      key={'connect wallet button'}
                      onClick={() => {
                        setActivatingConnector(currentConnector);
                        activate(connectorsByName[name]);
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          top: '0',
                          left: '0',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'black',
                          margin: '0 0 0 1rem',
                        }}
                        onClick={() => {
                          deactivate();
                        }}
                      >
                        {activating && (
                          <Spinner
                            color={'black'}
                            style={{ height: '25%', marginLeft: '-1rem' }}
                          />
                        )}
                        {/* wallet connector */}
                        {connected && account && (
                          <>
                            <span role="img" aria-label="chain">
                              {chainId === 43114 && (
                                <>
                                  <span padding="1em">
                                    <img
                                      src="https://cdn.discordapp.com/attachments/944459435475079189/944459543570685983/avalanche-avax-logo.png"
                                      alt="test"
                                      width="30em"
                                    />
                                  </span>
                                </>
                              )}
                              {chainId === 250 && (
                                <img
                                  src="https://cdn.discordapp.com/attachments/944459435475079189/944459543788814336/ftm.png"
                                  alt="test"
                                  width="30em"
                                />
                              )}
                            </span>
                            <span>
                              {account === undefined ? (
                                '...'
                              ) : account === null ? (
                                'None'
                              ) : (
                                <EnsName address={account} />
                              )}
                              {console.log(ethers.getDefaultProvider())}
                            </span>
                            <span>
                              {ethBalance === undefined
                                ? '...'
                                : ethBalance === null
                                ? 'Error'
                                : `Ξ${parseFloat(
                                    formatEther(ethBalance)
                                  ).toPrecision(4)}`}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </>
              )}
            </>
          );
        })}

        {/* <span>Chain Id</span> */}
        {/* <span role="img" aria-label="chain">
          {chainId === 43114 && (
            <>
              <span>
                {account === undefined
                  ? '...'
                  : account === null
                  ? 'None'
                  : `${account.substring(0, 6)}...${account.substring(
                      account.length - 4
                    )}`}
              </span>
              <span>
                <img
                  src="https://cdn.discordapp.com/attachments/944459435475079189/944459543570685983/avalanche-avax-logo.png"
                  alt="test"
                  width="25em"
                  alignItems="center"
                />
                <span>
                  {ethBalance === undefined
                    ? '...'
                    : ethBalance === null
                    ? 'Error'
                    : `${parseFloat(formatEther(ethBalance)).toPrecision(4)}`}
                </span>
              </span>
            </>
          )}
          {chainId === 250 && (
            <img
              src="https://cdn.discordapp.com/attachments/944459435475079189/944459543788814336/ftm.png"
              alt="test"
              width="30em"
            />
          )}
        </span>
        <span>
          {account === undefined ? (
            '...'
          ) : account === null ? (
            'None'
          ) : (
            <EnsName address={account} />
          )}
          {console.log(ethers.getDefaultProvider())}
        </span>
        <span>
          {ethBalance === undefined
            ? '...'
            : ethBalance === null
            ? 'Error'
            : `Ξ${parseFloat(formatEther(ethBalance)).toPrecision(4)}`}
        </span> */}
      </h1>
      {/* </h3> */}

      <hr style={{ margin: '0.5rem' }} />
      {/* wallet connector */}
      {/* <div
        style={{
          display: 'grid',
          gridGap: '1rem',
          gridTemplateColumns: '1fr 1fr 1fr',
          maxWidth: '20rem',
          margin: 'auto',
        }}
      >
        {Object.keys(connectorsByName).map((name) => {
          const currentConnector = connectorsByName[name];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled =
            !triedEager || !!activatingConnector || connected || !!error;

          return (
            <button
              style={{
                height: '3rem',
                borderRadius: '1rem',
                borderColor: activating
                  ? 'orange'
                  : connected
                  ? 'green'
                  : 'unset',
                cursor: disabled ? 'unset' : 'pointer',
                position: 'relative',
              }}
              disabled={disabled}
              key={name}
              onClick={() => {
                setActivatingConnector(currentConnector);
                activate(connectorsByName[name]);
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'black',
                  margin: '0 0 0 1rem',
                }}
              >
                {activating && (
                  <Spinner
                    color={'black'}
                    style={{ height: '25%', marginLeft: '-1rem' }}
                  />
                )}
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {name}
            </button>
          );
        })}
      </div>
      <hr style={{ margin: '2rem' }} /> */}

      <div
        style={{
          display: 'flex',
          maxWidth: '100%',
          maxHeight: '100%',
          height: 'auto',
          width: '80%',
          margin: 'auto',
          justifyContent: 'center',
          borderWidth: '20px',
          //borderStyle: 'inset',
          borderRadius: '34px',
          background: 'linear-gradient(90deg, #e3ffe785 0%, #d9e7ff85 100%)',

          // borderImage:
          //   'radial-gradient(circle, rgba(2,0,36,0) 0%, rgba(0,0,0,0) 68%, rgba(0,115,129,0.31416316526610644) 85%, rgba(255,188,0,0.45) 94%, rgba(210,137,35,0.6) 97%, rgba(210,137,35,0.3) 100%) 1',
        }}
      >
        {/* code here */}
        {library && account && (
          <>
            <span
              style={{
                width: '100%',
                height: 'fit-content',
                display: 'block',

                padding: '2em 2em 2em 2em',
              }}
            >
              <CreateOrder library={getLibrary} account={account}></CreateOrder>
            </span>
            {/* <button
              style={{
                height: '3rem',
                borderRadius: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => {
                library
                  .getSigner(account)
                  .signMessage('👋')
                  .then((signature) => {
                    window.alert(`Success!\n\n${signature}`);
                  })
                  .catch((error) => {
                    window.alert(
                      'Failure!' +
                        (error && error.message ? `\n\n${error.message}` : '')
                    );
                  });
              }}
            >
              Sign Message
            </button> */}
          </>
        )}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
