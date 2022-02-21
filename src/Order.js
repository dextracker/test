import { ethers } from 'ethers';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

// <!-- By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL -->

export const useTokenBalance = (address) => {
  const contract = useERC20Token(false);
  return useCallback(async (address) => {
    /* THE NEW LINE */
    return await evaluateTransaction(contract, 'balanceOf', [address]);
  }, []);
};
export function Orders({ library, wallet }) {
  const [signer, setSigner] = useState('');
  useEffect(() => {
    let _signer = library.getSigner(wallet);
    console.log(_signer);
    setSigner(_signer);
  }, [library, wallet]);
  return (
    <>
      <h3>{signer.address}</h3>
      <div class="flex-container">
        <div>{wallet}</div>
        <div>{signer.address}</div>
      </div>
    </>
  );
}
