import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'
import ConnectWalletButton from './Components/ConnectWalletButton'

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


function TaskCreation() {
  // rinkeby test network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "rinkeby");

  // form
  const {handleSubmit, register, formState: {errors, isSubmitting},} = useForm();

  async function postToBackend(values) {
    
    // TODO check what time to use? 
    const contractObject = {
      contractAddress : values.deployedAddress,
      setter : provider.getSigner().getAddress(),
      created : Date.now(),
      expiry : values['expiry-date'],
      funds : values['funds-assigned']
    };

    const taskInfo = {
      taskName : values['task-name'],
      taskDesription : values['task-description'],
      example : values['example'],
      numLabelsRequired : values['num-labels'],
      labelOptions : values['ptins'], 
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

    const content = await rawResponse.json();
    return content;
  }



  async function deployContract(values)
  { 
    // deploy a new Task contract
    const Task = await new ethers.ContractFactory(abi, bytecode, provider.getSigner());
    const task = await Task.deploy()
    await task.deployed();
    const deployedAddress = task.address;
    values.deployedAddress = deployedAddress

    // TODO send funds to contract

    postToBackend(values);

  }



  function onSubmit(values) {
    return new Promise((resolve) => {
      deployContract(values)
    })
  }

// TODO form validation with Yup
  return (
    <div className='task-creation'>
      <ConnectWalletButton/>
      <h1>Task Creation</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isRequired>
        <FormLabel htmlFor='task-name'>Task Name</FormLabel>
        <Input id='task-name' placeholder='Task Name' {...register('task-name', {
            required: true })} />
        <FormLabel htmlFor='task-description'>Task Description</FormLabel>
        <Input id='task-name' placeholder='Task Name' {...register('task-description', {
            required: true,
            })}/>
        <FormLabel htmlFor='images'>Images</FormLabel>
        <InputGroup size='sm'>
          <InputLeftAddon children='https://' />
          <Input placeholder='imgr.com' {...register('images', {
            required: true,
            })} />
        </InputGroup>
        <FormLabel htmlFor='num-labels'>Number of labels per task</FormLabel>
        <NumberInput min={1}>
          <NumberInputField id='num-lables' {...register('num-labels', {
            required: true,
            })} />
        </NumberInput>
        <FormLabel htmlFor='funds-assigned'>Funds assigned for payout (Gwei)</FormLabel>
        <InputGroup>
          <NumberInput min={1}>
            <NumberInputField id='funds-assigned' {...register('funds-assigned', {
            required: true,
            })}/>
          </NumberInput>
          <InputRightAddon children='Gwei' />
        </InputGroup>
        <FormLabel htmlFor='example'>Example Labelling</FormLabel>
        <Input id='example' placeholder='Task Name' {...register('eample', {
            required: true,
            })}/>
        <FormLabel htmlFor='expiry-date'>Expiry Date</FormLabel>
        <Input id='expiry-date' placeholder='12/05/22' {...register('expiry-date', {
            required: true,
            })}/>
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
