import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form'


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
  // ropsten test network
  const provider = new ethers.providers.Web3Provider(window.ethereum, "ropsten");
  const signer = provider.getSigner();
  const [taskName, setTaskName] = useState('');
  const [example, setExample] = useState('');
  const [images, setImages] = useState();
  const [taskInfo, setTaskInfo] = useState('');
  const [numLabelsRequired, setNumLabelsRequired] = useState();
  const [labelOptions, setLabelOptions] = useState();
  const [expiryDate, setExpiryDate] = useState('');
  const [taskFunds, setTaskFunds] = useState();

  // form
  const {handleSubmit, register, formState: {errors, isSubmitting},} = useForm();

  async function postToBackend(deployedAddress) {
    
    // TODO check what time to use? 
    const contractObject = {
      contractAddress : deployedAddress,
      setter : signer.getAddress(),
      created : Date.now(),
      expiry : expiryDate,
      funds : taskFunds
    };

    const taskInfo = {
      taskName : taskName,
      taskDesription : taskInfo,
      example : example,
      numLabelsRequired : numLabelsRequired,
      labelOptions : labelOptions, 
      status : "active"
    }

    const data  = {
      contractObject : contractObject,
      taskInfo : taskInfo,
      images : images
    }

    // post to back end
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

  function validateInput(){
    // Validates the state variables for task creation
    // TODO implement
    let response = {
        success : false,
        errMessage : ""
    }
    return response;
  }

  async function deployContract()
  { 
    let validationMessage = validateInput();
    if (validationMessage.success) { 
      // deploy a new Task contract
      const Task = await ethers.ContractFactory(abi, bytecode, signer);
      const task = await Task.deploy()

      await task.deployed;
      const deployedAddress = task.address;

      postToBackend(deployedAddress);
    }
    else{
      console.log(validationMessage.errMessage)
    }

  }



  function onSubmit(values) {
    return new Promise((resolve) => {
      setTimeout(() => {
        alert(JSON.stringify(values, null, 2))
        resolve()
      }, 3000)
    })
  }

// TODO form validation with Yup
  return (
    <div className='task-creation'>
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
        <Input id='example' placeholder='Task Name' />
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
