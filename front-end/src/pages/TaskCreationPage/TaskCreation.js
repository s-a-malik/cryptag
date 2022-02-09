import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'
import Header from '../../components/Header'
import ConnectWalletButton from '../../components/ConnectWalletButton'
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import "./TaskCreation.css";
import Settlement from '../../contracts/Settlement.json'
import Task from '../../contracts/Task.json'
// import contract from './contracts/Creater.json';
import { ethers } from 'ethers';
import {
  Center,
  Textarea,
  Heading,
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
  Stack,
} from '@chakra-ui/react'

// TODO change for production
const backendURL = 'http://localhost:3042';

// yup validation for form
const schema = yup.object({
  taskName: yup.string().required(),
  taskDescription : yup.string().required(),
  expiryDate : yup.date().required(),
  images: yup.string().test('is-urls', 'Must be line seperated URLs', value => validateURLs(value))
}).required();

// ensures one exmaple per line 
function validateURLs(value) {
  const lines = value.split(/\r?\n/);
  const isURLRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
  return lines.every(x => isURLRegex.test(x));
}


export function TaskCreation() {
  // rinkeby test network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");

  // react-hooks-form
  const {handleSubmit, register, formState: {errors, isSubmitting},} = useForm({
    resolver: yupResolver(schema)
  });

  // posts the values from form to backend API 
  // constructs the contract and taskInfo objefts for posting
  // TODO handle server response 
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
    // convert images to array
    const imagesArray = values['images'].split(/\r?\n/);
    const data  = {
      contractObject : contractObject,
      taskInfo : taskInfo,
      images : imagesArray
    }

    // post to back end
    alert(JSON.stringify(data));
    const requestURL = backendURL + '/tasks/create-task'

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
    await task.deposit({value: ethers.utils.parseEther((values.funds).toString())});
    values.settlementAddress = settlement.address;
    values.taskAddress = task.address;
    postToBackend(values);
    console.log(values);
    // log address of deployed contracts 
    alert(`Contract succesfully deployed. \nSettlement: ${settlement.address} \nTask: ${task.address}`)

  }



  function onSubmit(values) {
    return new Promise((resolve) => {
      deployContract(values)
    })
  }

// TODO form validation with Yup
// TODO validation for images
// TODO allow for options 
  return (
    <div className='wrapper'>
    <Header title="Task Creation" />
    <div className='task-creation-app'>
        <Stack >
        <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isRequired>
          <FormLabel htmlFor='taskName'>Task Name</FormLabel>
          <Input id='taskName' placeholder='Task Name' {...register('taskName', {
              required: true })} />
          <FormLabel htmlFor='taskDescription'>Task Description</FormLabel>
          <Textarea id='taskName' placeholder='Task Name' {...register('taskDescription', {
              required: true,
              })}/>
          <FormLabel htmlFor='images'>Images - one URL per line</FormLabel>
            <Textarea placeholder='imgr.com' {...register('images', {
              required: true,
              })} />
          <p>{errors.images?.message}</p>
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
          </Stack>
    </div>
    </div>
  )
}
