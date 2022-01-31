import React from 'react';
import ReactDOM from 'react-dom';
import TaskCreation from './TaskCreation';
import {ethers} from 'ethers';
import { ChakraProvider } from '@chakra-ui/react'

ReactDOM.render(
  <ChakraProvider>
    <TaskCreation />
  </ChakraProvider>,
  document.getElementById('root')
);


