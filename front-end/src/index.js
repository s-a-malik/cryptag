import { ethers } from 'ethers';
import * as React from "react";
import { render } from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { TaskCreation, TasksPage, TaskPage } from "./pages";
import { UserContextProvider } from './lib/UserContext';

// https://codesandbox.io/s/po6q5?file=/src/routes/AboutPage/AboutPage.tsx - example sandbox

render(
  <ChakraProvider>
    <UserContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TaskCreation />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskPage />} />
        </Routes>
      </Router>
    </UserContextProvider>
  </ChakraProvider>,
  document.getElementById("root"));