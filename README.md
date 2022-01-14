# decentra-turk

Crowdsourcing data labelling tasks on the ethereum blockchain.

## TODO

[] Front end job creation and dataset upload
[] Front end labelling
[] Back end label submission and consensus
[] Contracts for job posting and REP token 


## Front End

Built with React. (other framework?)

## Back End

Server stores data labels given by each address. Uses this to compute consensus label (weighted by $REP).

On settlement, uses label accuracy metrics to payout $REP fairly. Pays back the owner for any unlabelled examples

## Smart Contracts

