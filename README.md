# CrypTag

Crowdsourcing data labelling tasks on the ethereum blockchain.


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
