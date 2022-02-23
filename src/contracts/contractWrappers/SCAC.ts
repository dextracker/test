import { ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
const SCACAbi = require('../SCAC.json');
const SCACFactoryAbi = require('../SCACFactory.json');

const ISCAC = new Interface(SCACAbi.abi);
const ISCACFactoryAbi = new Interface(SCACFactoryAbi.abi);

export class SCAC {
  address: string;
  factory: ethers.ContractFactory;
  ISCAC: ethers.utils.Interface;
  constructor(address: string, signer?: ethers.Signer) {
    this.address = address;
    this.factory = new ethers.ContractFactory(
      ISCACFactoryAbi,
      SCACFactoryAbi.bytecode,
      signer
    );
    this.ISCAC = ISCAC;
  }

  deploySCAC() {}
}
