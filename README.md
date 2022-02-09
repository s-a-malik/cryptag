# CrypTag

Crowdsourcing data labelling tasks on the ethereum blockchain.

Final project for Chainshot OxBridge Bootcamp, Dec 2021 - Jan 2022.

## Usage

- Set up a `.env` file with an alchemy endpoint `RINKEBY_URL` and a private key for the server `PRIVATE_KEY` (change the public address in the contracts if necessary). 
- Change into the `solidity` folder, `npm install`, then compile the contracts using `npx hardhat compile`.
- Change into the `back-end` folder, `npm install`, then start the server using `nodemon server.js`
- Change into the `front-end` folder, `npm install`, then start the front-end using `npm start`


## Front End

Built with React/Chakra UI.

- Task Creation
- Task Viewing
- Label a task and submit labels
- View Results

## Back End

Server stores data labels given by each address. Uses this to compute consensus label.

On settlement, uses label accuracy metrics to payout fairly. 

## Smart Contracts

- Settlement.sol
  - Disperses funds to the labellers
  - This can be changed later on if we adjust the consensus mechanism.
- Task.sol
  - Creates and stakes a task.
