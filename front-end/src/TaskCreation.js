import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'
import ConnectWalletButton from './Components/ConnectWalletButton'
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import "./TaskCreation.css";
import Settlement from './contracts/Settlement.json'
import Task from './contracts/Task.json'
// import contract from './contracts/Creater.json';
import { ethers } from 'ethers';
import {
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Button,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react'

// TODO import contract ABI and bytecode
const contractAddress = "";
const abi = "";
const bytecode = '';
const backendURL = '';


const schema = yup.object({
  taskName: yup.string().required(),
  taskDescription : yup.string().required(),
  expiryDate : yup.date().required()
}).required();

function TaskCreation() {
  // rinkeby test network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");

  // form
  const {handleSubmit, register, formState: {errors, isSubmitting},} = useForm({
    resolver: yupResolver(schema)
  });

  async function postToBackend(values) {
    
    // TODO check what time to use? 
    const contractObject = {
      contractAddress : values.deployedAddress,
      setter : provider.getSigner().getAddress(),
      created : Date.now(),
      expiry : values['expiryDate'],
      funds : values['funds']
    };

    const taskInfo = {
      taskName : values['taskName'],
      taskDesription : values['taskDescription'],
      example : values['example'],
      numLabelsRequired : values['numLabels'],
      labelOptions : values['options'], 
      status : "active"
    }

    const data  = {
      contractObject : contractObject,
      taskInfo : taskInfo,
      images : values['images']
    }

    // post to back end
    alert(JSON.stringify(data));
    const rawResponse = await fetch(backendURL, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    //const content = await rawResponse.json();
    //return content;
  }

  
  // Deploys contracts using user values in form. Calls postToBackend.
  // TODO #9 handle if user runs out of funds after deploying contracts, before funding
  // TODO Handle user rejecting transaction
  async function deployContract(values)
  { 
    // first deploy settlement
    alert(values.funds);
    const SettlementFactory = new ethers.ContractFactory(Settlement.abi, Settlement.bytecode, provider.getSigner());
    const settlement = await SettlementFactory.deploy();
    await settlement.deployed();
    // deploy task contract
    const TaskFactory =  new ethers.ContractFactory(Task.abi, Task.bytecode, provider.getSigner());
    const task = await TaskFactory.deploy(settlement.address);
    await task.deployed();
    // send funds to task
    task.deposit({value: ethers.utils.parseEther((values.funds).toString())});
    values.settlementAddress = settlement.address;
    values.taskAddress = task.address;
    postToBackend(values);
    console.log(values);

  }



  function onSubmit(values) {
    return new Promise((resolve) => {
      deployContract(values)
    })
  }

// TODO form validation with Yup
  return (
    <div className='task-creation'>
      <ConnectWalletButton className="connect-wallet"/>
      <h1>Task Creation</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isRequired>
        <FormLabel htmlFor='taskName'>Task Name</FormLabel>
        <Input id='taskName' placeholder='Task Name' {...register('taskName', {
            required: true })} />
        <FormLabel htmlFor='taskDescription'>Task Description</FormLabel>
        <Input id='taskName' placeholder='Task Name' {...register('taskDescription', {
            required: true,
            })}/>
        <FormLabel htmlFor='images'>Images</FormLabel>
        <InputGroup size='sm'>
          <InputLeftAddon children='https://' />
          <Input placeholder='imgr.com' {...register('images', {
            required: true,
            })} />
        </InputGroup>
        <FormLabel htmlFor='numLabels'>Number of labels per task</FormLabel>
        <NumberInput min={1}>
          <NumberInputField id='num-lables' {...register('numLabels', {
            required: true,
            })} />
        </NumberInput>
        <FormLabel htmlFor='funds'>Funds assigned for payout (Eth)</FormLabel>
        <InputGroup>
          <NumberInput>
            <NumberInputField id='funds' {...register('funds', {
            required: true,
            })}/>
          </NumberInput>
          <InputRightAddon children='Eth' />
        </InputGroup>
        <FormLabel htmlFor='example'>Example Labelling</FormLabel>
        <InputGroup size='sm'>
          <InputLeftAddon children='https://' />
          <Input placeholder='example.com' {...register('example', {
            required: true,
            })} />
        </InputGroup>
        <FormLabel htmlFor='expiryDate'>Expiry Date</FormLabel>
        <Input id='expiryDate' placeholder='12/05/22' {...register('expiryDate', {
            required: true,
            })}/>
          <p>{errors.expiryDate?.message}</p>
        <FormLabel htmlFor='options'>Labelling Options</FormLabel>
        <Input id='options' placeholder='labelling options' {...register('options', {
            required: true,
            })}/>
        <FormErrorMessage>
          {errors.name && errors.name.message}
        </FormErrorMessage>
      </FormControl>
      <Button
            mt={4}
            colorScheme='teal'
            isLoading={isSubmitting}
            type='submit'
          >
            Submit
          </Button>
        </form>
    </div>
  )
}

export default TaskCreation;
