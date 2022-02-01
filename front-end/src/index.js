import {ethers} from 'ethers';
import * as React from "react";
import { render } from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { TaskCreation, TasksPage } from "./pages";

// https://codesandbox.io/s/po6q5?file=/src/routes/AboutPage/AboutPage.tsx - example sandbox

render(
  <ChakraProvider>
    <Router>
      <Routes>
        <Route path="/" element={<TaskCreation/>} />
        <Route path="/tasks" element={<TasksPage/>} />
      </Routes>
    </Router>
  </ChakraProvider>, 
  document.getElementById("root"));