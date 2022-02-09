import { ethers } from 'ethers';

export async function getAddress() {
  const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");
  // Check if MetaMask installed
  if (window.ethereum) {
      // check if correct network connected
      const chainId = await window.ethereum.request({ method: 'eth_chainId'});

      console.log(chainId)
      if ( chainId != "0x4") {
          alert("Please change to Rinkeby/")
      }
      else {
          
          await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();

          console.log("Account:", await signer.getAddress());
          const balance = await provider.getBalance(signer.getAddress());
          console.log("Balance: ", balance);
          
          return await signer.getAddress();
      }
  }
  else{
      alert("No wallet/ethereum provider detected, please install metamask.")
  }
}