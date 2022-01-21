/*
server.js
Provides endpoints for the front-end to interact with stores relevant data centrally.
Built using Express.js.

Function:
- Stores dataset/images received the front end.
- Serves images and form to fill in to label an image to the front end
- Receives labels and stores them in a database.
- Works out the consensus of the labels for each data point and the payout for each account.
- Sends the payout to the accounts via smart contract

TODO:
- Add a way to view see progress of the consensus
- Test everything
*/

const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

console.log('Starting server...');
app.use(cors());
app.use(express.json());

/* base task class
Each task has the following fields:
- taskId: unique id for the task (same as index of the array) Necessary?
- taskInfo:
    - taskName: name of the task
    - taskDescription: description of the task for displaying on homepage
    - example: url of the example image and associated label for labellers to see
    - numLabelsRequired: number of labels required *per example* to complete the task
    - labelOptions: dict of names of possible labels (keys) and their values (unique id)
    - status: the status of the task (open, expired, or completed)
- contract:
    - contractAddress: address of the smart contract associated with the task
    - setter: the public address that created the task
    - created: the time the task was created
    - expiry: the time the task expires
    - funds: funds available to be spent on the task (dynamically updated on contract event)
- data:
    - images: an array of images to be displayed to the user (TODO URLs?)
    - labels: an array of dicts(address => label) of the submitted labels
    - numLabellers: number of labellers who have submitted labels for this task
    - consensusLabels: the consensus label for each image
    - payout: payout per labeller (address => value) for each account (created when consensus is reached)  
        TODO: probs best for this to be a proporitional payout, then send payout*funds. 
*/
class Task {
    /*
    Parameters:
    - taskId: unique id for the task (same as index of the array) - get from length of array or random?
    - taskInfo (object): as described above
    - contract (object): as described above
    - images (array): an array of images to be displayed to the user (TODO URLs?)
    */
    constructor(taskId, taskInfo, contract, images) {
        this.taskId = taskId;
        this.taskInfo = taskInfo;
        this.contract = contract;
       
        // initialize data
        this.data = {
            // imagesIds are the index of the array of images
            images: images,
            labels: {},  // empty dict to start
            labellers: [],
            consensusLabels: {},
            payout: {}
        }
    }

    /*
    Returns public information about the task in an object
    TODO could be a getter?
    */
    getTaskInfo() {
        const info = {
            taskId: this.taskId,
            taskInfo: this.taskInfo,
            contract: this.contract,
        }
        return info;
    }

    /*
    Works out the consensus labels given the current labels submitted.
    */
    computeConsenus() {

        // iterate through label array and allocate consensus via majority vote
        // TODO make this more efficient, change to REP weighted.

        // payout for each labeller
    }

}


const tasks = []

// add an example task
tasks.push(new Task(
    0,
    {
        taskName: 'Test Task',
        taskDescription: 'This is a test task',
        example: 'https://picsum.photos/200',
        numLabelsRequired: 3,
        labelOptions: {
            'road': '0',
            'person': '1',
            'field': '2'
        },
        status: 'open',
    },
    {
        contractAddress: '0x0',
        setter: '0x0',
        created: Date.now(),
        expiry: Date.now() + (1000 * 60 * 60 * 24 * 7),
        funds: 1,
    },
    [
        'https://picsum.photos/200',
        'https://picsum.photos/300',
        'https://picsum.photos/400',
    ]
));


// show the tasks available to the front end 
app.get('/tasks', (req, res) => {
  // only show task info, not the data
  // TODO: only show tasks that are open?
  const infoToDisplay = tasks.map(task => {
    return task.getTaskInfo();
    });
  res.send({ infoToDisplay });
});


// create a new task
// TODO should be a PUT request?
app.post('/tasks/create-task', (req, res) => {
    const setterAddress = req.body;
    const {taskInfo, expiry, funds, images} = req.body;

    // TODO create contract here (or should do on client side)

    // contract info for database
    const contract = {
        contractAddress: '',    // TODO: get from blockchain
        setter: setterAddress,
        created: Date.now(),    // TODO: get from blockchain
        expiry: expiry,
        funds: funds,           // TODO: get from blockchain instead
    }

    const taskId = tasks.length;    // TODO: this could be random instead.
    // create the task
    tasks.push(new Task(taskId, taskInfo, contract, images));
});

// serves images in a random order to the front end inside a task
// TODO need some security so user's address is used (and verified) in the request
// - use metamask to provide credential check. 
// TODO need to make sure that the images are not repeated to the same user


// submit labels to server after labelling in front end
// TODO need to encrypt this to send across internet?
app.post('tasks/:taskId/submit-labels', (req, res) => {
  console.log('Received a batch of labels...');
  // TODO need user's address to be verified - sign with metamask
  // TODO need to prevent this from being submitted multiple times or 
  // called directly without actually doing the labels (security), not important for now.
  // TODO need to check whether the taskId exists

  // get the address of the labeller
  const {labellerAddress} = req.params;
  // unpack request body (labels are a mapping(imageId => label))
  const {taskId, labels} = req.body;
  const task = tasks[taskId];

  // iterate through the labels and add them to the task object
  for (const imageId in labels) {
    task.data.labels[imageId][address] = labels[imageId];
  }

  // add the labeller to the list of labellers
  if (!task.data.labellers.includes(labellerAddress)) {
    task.data.labellers.push(labellerAddress);
  }

});

// app.get()


app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
