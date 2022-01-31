import { useEffect, useState } from 'react';
// import contract from './contracts/Creater.json';
import { ethers } from 'ethers';

// TODO import contract ABI and bytecode
const contractAddress = "";
const abi = contract.abi;
const bytecode = '';
const backend = '';


function App() {
  // ropsten test network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "ropsten");
  const signer = await provider.getSigner();
  const [dbURL, setdbURL] = useState('');
  const [taskInfo, setTaskInfo] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');


  async function deployContract()
  {
    // deploy a new Task contract
    const Task = await ethers.getContractFactory(abi, bytecode, signer);
    const task = await Task.deploy()

    await task.deployed;
    const deployedAddress = task.address;
    

  }

  async function submitToBackend(){

  }




  return (
    <div className='main-app'>
      <h1>Scrappy Squirrels Tutorial</h1>
      <div>
      {connectWalletButton()}
      </div>
    </div>
  )
}

export default App;