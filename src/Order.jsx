import { ethers } from 'ethers';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Web3ReactProvider,
  useWeb3React,
  UnsupportedChainIdError,
} from '@web3-react/core';
import { SCAC } from './contracts/contractWrappers/SCAC';
import { Dropdown } from 'reactjs-dropdown-component';
import { useEagerConnect, useInactiveListener } from './hooks';
const joeJson = require('./utils/joeTokens.json');
const IERC20TokenV06 = require('./contracts/IERC20TokenV06.json');

async function getBalance(address, abi, signer) {
  let contract = new ethers.Contract(address, abi, signer);
  let bal = await contract.balanceOf(signer.address);
  return bal;
}

// value={token0}
// tokens={joeTokens}
// setToken={handleToken0}
// setMinimized={setToggleInput0}
// isMinimized={toggleInput0}

const TokenList = (params) => {
  //(tokens, { setToken, minimize }, currentToken, isMinimized)
  const context = useWeb3React();
  const [_signer, _setSigner] = useState();
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
  const triedEager = useEagerConnect();
  console.log('Connecting To Provider', triedEager);

  async function temp() {
    let lib = await library.getSigner(account);
    return lib;
  }
  console.log(temp());

  function handleChange(e) {
    //setToken(e.target.key);
  }

  // useEffect(() => {
  //   if (signer) {
  //     let bal = getContract(
  //       tokens.tokens[0].address,
  //       IERC20TokenV06.abi,
  //       signer
  //     );
  //     console.log(bal);
  //   }
  // }, [library, signer]);
  console.log('CURRENT');

  return params.tokens.map((t) => (
    <div
      key={t.address}
      onClick={(e) => {
        params.setToken(e.target.alt);
        params.setMinimized(false);
      }}
      style={{
        radius: '2px',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          float: 'right',
          margin: '0.5em 0.5em 0em 0em',
        }}
      >
        {t.symbol}
      </div>
      <img
        style={{
          objectFit: 'cover',
          width: '2em',
          height: '2em',
          borderRadius: '50%',
          margin: '0.3em',
        }}
        src={t.logoURI}
        alt={t.address}
      />

      {/* {getBalance(t.address, IERC20TokenV06.abi, signer)} */}
    </div>
  ));
};

export function CreateOrder(library, account) {
  const [signer, setSigner] = useState(null);
  const [factory, setFactory] = useState('');
  const [depositPool, setDepositPool] = useState('');
  const [token0, setToken0] = useState('');
  const [token1, setToken1] = useState('');
  const [lpPair, setLpPair] = useState('');
  const [rewardToken, setRewardToken] = useState('');
  const [compoundingToken, setCompoundingToken] = useState('');
  const [router, setRouter] = useState('');
  const [poolInfo, setPoolInfo] = useState('');
  const [submitOrder, setSubmitOrder] = useState(false);
  const [joeTokens, setJoeTokens] = useState(joeJson.tokens);
  const [toggleInput0, setToggleInput0] = useState(false);
  const [toggleInput1, setToggleInput1] = useState(false);
  const token0Ref = React.useRef(null);
  const token1Ref = React.useRef(null);
  const lpPairRef = React.useRef(null);
  const [token0Index, settoken0Index] = useState('');
  const [token1Index, settoken1Index] = useState('');
  const [tokenIMG0, settokenIMG0] = useState('');
  const [tokenIMG1, settokenIMG1] = useState('');

  function findInJson(address) {
    let tokens = [];
    joeTokens.forEach((element, index) => {
      if (element.address === address) {
        console.log('found');
        tokens.push(joeTokens[index]);
        console.log(tokens);
      }
    });

    return tokens;
  }

  function handleToken0(value) {
    setToken0(value);
  }
  function handleToggleInput0(value) {
    console.log('handling toggle 1', value);
    setToggleInput0(value);
  }
  function handleToggleInput1(value) {
    console.log('handling toggle 1', value);
    setToggleInput1(value);
  }
  function handleToken1(value) {
    setToken1(value);
  }

  useEffect(() => {
    settokenIMG0(findInJson(token0));
  }, [token0]);
  useEffect(() => {
    settokenIMG1(findInJson(token1));
  }, [token1]);

  return (
    <>
      <div className="flex-container">
        <h3
          style={{
            margin: '0.6em 0.6em',
            fontSize: '40px',
            float: 'center',
            textAlign: 'center',
          }}
        >
          Create a Flywheel
        </h3>

        <div
          style={{
            background: 'none',
            display: 'inline-flex',
            justifyContent: 'space-evenly',
            width: '80%',
            height: '20em',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'block',
              float: 'left',
            }}
          >
            <input
              type="text"
              className="inputMain"
              placeholder={'Token 0'}
              value={token0}
              ref={token0Ref}
              onChange={(e) => setToken0(e.target.value)}
              onClick={(e) =>
                handleToggleInput0(toggleInput0 === false ? true : false)
              }
            />
            {toggleInput0 === true && (
              <div className="TokenDropdown">
                <TokenList
                  value={token0}
                  tokens={joeTokens}
                  setToken={handleToken0}
                  setMinimized={setToggleInput0}
                  isMinimized={toggleInput0}
                />
              </div>
            )}
          </div>
          <div>
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                float: 'right',
                width: '15em',
              }}
            >
              <input
                type="text"
                className="inputMain"
                placeholder={'Token 1'}
                value={token1}
                ref={token1Ref}
                onChange={(e) => setToken0(e.target.value)}
                onClick={(e) =>
                  handleToggleInput1(toggleInput1 === false ? true : false)
                }
              />
              {toggleInput1 === true && (
                <div className="TokenDropdown">
                  <TokenList
                    value={token1}
                    tokens={joeTokens}
                    setToken={setToken1}
                    setMinimized={setToggleInput1}
                    isMinimized={toggleInput1}
                  />
                </div>
              )}

              <>
                {console.log('URL', tokenIMG0.imageURI)}
                <div>
                  <img
                    style={{
                      objectFit: 'cover',
                      width: '2em',
                      height: '2em',
                      borderRadius: '50%',
                      margin: '0.3em',
                    }}
                    src={tokenIMG0.imageURI}
                  />
                </div>
                <div>
                  <img
                    style={{
                      objectFit: 'cover',
                      width: '2em',
                      height: '2em',
                      borderRadius: '50%',
                      margin: '0.3em',
                    }}
                    src={tokenIMG1.imageURI}
                  />
                </div>
              </>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
