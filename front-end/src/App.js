import './App.css';
import { ethers } from 'ethers'; 
// add contract ABIs to the utils folder
const jobJSON = require("./utils/Job.json");
const repJSON = require("./utils/Rep.json");

function App() {
  // get metamask provider
  const { ethereum } = window;

  // metamask - request accounts
  // see the RPC API docs on Metamask
  if(!ethereum) {
    console.log("You don't have metamask!");
  } else {
    console.log("Provider detected!", ethereum);
  }
  // use the metamask provider to get accounts.
  ethereum.request({method: "eth_requestAccounts"});

  // use metamask for the wallet provider (whatever network you're on on metamask)
  const provider = new ethers.providers.Web3Provider(ethereum);

  // draft up our contract instance
  // use ethers contract library
  const contractAddress = ""
  // get the ABI from hardhat previously compiled and put into utils folder
  const faucetABI = faucetJson.abi; // go into json
  const signer = provider.getSigner(); // get the signer from metamask

  // instance of the contract
  const faucet = new ethers.Contract(contractAddress, faucetABI, signer);

  async function withdraw() {
    // call the withdraw function on the contract. This requires the wallet to pay for the gas. 
    // 
    const amount = ethers.utils.parseUnits("0.005", "ether");
    await faucet.withdraw(amount);
  }

  // link a function to a button to interact with the contract
  return (
    <div className="App">
      <div className="title">Our Faucet!</div>
      <button className="my-button" onClick={withdraw}>Withdraw</button>
    </div>
  );
}

export default App;

