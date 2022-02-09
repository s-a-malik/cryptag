import { ethers } from 'ethers';

export async function getAddress() {
  if (window.ethereum) {

    const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return await signer.getAddress();

  } else {
    alert('No ethereum provider detected!')
  }
}