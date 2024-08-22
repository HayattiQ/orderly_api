import { config } from 'dotenv';
import { encodeBase58, ethers } from 'ethers';
import { webcrypto } from 'node:crypto';
import * as ed25519 from '@noble/ed25519';

config();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { getPublicKeyAsync, utils } = ed25519;

const MESSAGE_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' }
  ],
  AddOrderlyKey: [
    { name: 'brokerId', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'orderlyKey', type: 'string' },
    { name: 'scope', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'expiration', type: 'uint64' }
  ]
};

const OFF_CHAIN_DOMAIN = {
  name: 'Orderly',
  version: '1',
  chainId: 1,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
};

const BASE_URL = 'https://api-evm.orderly.org/';
const BROKER_ID = 'vls';
const CHAIN_ID = 1;


(async () => {

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
    console.log("address", await  wallet.getAddress())

    const privateKey = utils.randomPrivateKey();
    const orderlyKey = `ed25519:${encodeBase58(await getPublicKeyAsync(privateKey))}`;
    console.log("orderlyKey", orderlyKey)
    const timestamp = Date.now();
    console.log("timestamp", timestamp)
    console.log("expire",timestamp + 1_000 * 60 * 60 * 24 * 7)
    const addKeyMessage = {
      brokerId: BROKER_ID,
      chainId: CHAIN_ID,
      orderlyKey,
      scope: 'read,trading',
      timestamp,
      expiration: timestamp + 1_000 * 60 * 60 * 24 * 365 // 1 year
    };

    const signature = await wallet.signTypedData(
      OFF_CHAIN_DOMAIN,
      {
        AddOrderlyKey: MESSAGE_TYPES.AddOrderlyKey
      },
      addKeyMessage
    );
    console.log("signature", signature)
    const keyRes = await fetch(`${BASE_URL}/v1/orderly_key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: addKeyMessage,
        signature,
        userAddress: await wallet.getAddress()
      })
    });
    const keyJson = await keyRes.json();
    console.log('addAccessKey', keyJson);


})();