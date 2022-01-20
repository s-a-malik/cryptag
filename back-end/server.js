/*
Back end server for the Decentra-Turk project. 
- Stores dataset/images from the front end.
- Serves images and form to fill in to the front end
- Receives labels and stores them in a database.
- Works out the consensus of the labels for each data point and the payout for each account.
- Sends the payout to the accounts via smart contract
*/

const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

console.log('Starting server...');
app.use(cors());
app.use(express.json());


/* create an object to store each task
each task is a json object with the following fields:
- taskId: unique id for the task (same as index of the array)
- numLabelsRequired: number of labels required *per example* to complete the task
- contractAddress: address of the smart contract associated with the task
- funds: funds available to be spent on the task (dynamically updated on contract event)
- examples: an array of images to be displayed to the user (TODO URLs?)
- labelOptions: dict of names of possible labels (keys) and their values (unique id)
- labels: an array of dicts(address:label) of the submitted labels
- numLabellers: number of labellers who have submitted labels for this task
- consensus: the consensus label for each image
- payout: payout dict for each account (created when consensus is reached)
- status: the status of the task (open, expired, or completed)
- created: the time the task was created
- expiry: the time the task expires
- setter: the public address that created the task
*/
const tasks = [];

// show the tasks available to the front end
app.get('/tasks', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});


// create a new task
app.post('/tasks/create-task', (req, res) => {
    // get address confirmed from metamask
    // const {funds, examples, labelOptions, expiry} = req.body;


// serves images in a random order to the front end inside a task
// TODO need some security so user's address is used (and verified) in the request
// - use metamask to provide credential check. 
// TODO need to make sure that the images are not repeated to the same user


// submit labels to server after labelling in front end
// // TODO need to encrypt this to send across internet?
// app.post('tasks/:task/submit-labels', (req, res) => {
//   console.log('Received a batch of labels...');
//   // TODO need user's address to be verified - sign with metamask


// app.post('/send', (req, res) => {
//   const {sender, recipient, amount, signature} = req.body;
//   // verify request using sender public key and signature
//   bodyToVerify = JSON.stringify({
//     sender, amount, recipient
//   });
//   const key = ec.keyFromPublic(sender, 'hex');
//   const bodyHash = SHA256(bodyToVerify).toString();
//   const valid = key.verify(bodyHash, signature);
//   console.log(`Signature is ${valid ? 'valid' : 'invalid'}`);
//   if (!valid) {
//     console.log('Transaction failed!');
//     res.status(400).send('Invalid signature');
//   }
//   else {
//     // update sender balance
//     balances[sender] -= amount;
//     balances[recipient] = (balances[recipient] || 0) + +amount;
//     console.log(`Updated balances`);
//     res.send({ balance: balances[sender] });
//   }
// });


app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
