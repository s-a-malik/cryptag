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


// create a database to store each task
const tasks = {};


// show the tasks available to the front end
app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});


// serves images in a random order to the front end inside a task
// TODO need some security so user's address is used (and verified) in the request
// - use metamask to provide credential check. 
// TODO need to make sure that the images are not repeated to the same user




// TODO need to encrypt this to send across internet?
app.post('/send', (req, res) => {
  console.log('Received a batch of labels...');
  // TODO need user's address to be verified - sign with metamask
  const {sender, recipient, amount, signature} = req.body;
  // verify request using sender public key and signature
  bodyToVerify = JSON.stringify({
    sender, amount, recipient
  });
  const key = ec.keyFromPublic(sender, 'hex');
  const bodyHash = SHA256(bodyToVerify).toString();
  const valid = key.verify(bodyHash, signature);
  console.log(`Signature is ${valid ? 'valid' : 'invalid'}`);
  if (!valid) {
    console.log('Transaction failed!');
    res.status(400).send('Invalid signature');
  }
  else {
    // update sender balance
    balances[sender] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    console.log(`Updated balances`);
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
