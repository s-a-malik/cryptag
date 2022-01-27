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
const { nextTick } = require('process');
const port = 3042;

console.log('Starting server...');
app.use(cors());
app.use(express.json());    // for parsing application/json

/* base task class
Each task has the following fields:
- taskId: unique id for the task
- taskInfo:
    - taskName: name of the task
    - taskDescription: description of the task for displaying on homepage
    - example: url of the example image and associated label for labellers to see
    - numLabelsRequired: number of labels required *per example* to complete the task
    - labelOptions: dict of names of possible labels (keys) and their values (unique id)
    - status: the status of the task (active, expired, or completed)
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
    - images (array): an array of images to be displayed to the user (URLs?)
    */
    constructor(taskId, taskInfo, contract, images) {
        this.taskId = taskId;
        this.taskInfo = taskInfo;
        this.contract = contract;

        this.keySize = Object.keys(taskInfo.labelOptions).length;
        this.taskSize = images.length;
       
        // initialize data
        this.data = {
            // imagesIds are the index of the array of images
            images: images,
            labels: {},  // empty dict to start
            labellers: [],
            consensusLabels: [],
            payout: {}  // map of address => fractional payout
        }
    }

    /*
    Returns public information about the task in an object
    */
    getTaskInfo() {
        const info = {
            taskId: this.taskId,
            taskSize: this.taskSize,
            taskInfo: this.taskInfo,
            contract: this.contract,
        }
        return info;
    }

    /*
    Works out the consensus labels given the current labels submitted.
    Also computes the payout for each account.
    */
    computeConsenus() {
        // TODO change to REP weighted.
        
        // if called before enough labels are gathered and not called when expired, reject
        const notExpired = this.contract.expiry > Date.now();
        if (notExpired) {
            for (let id = 0; id < this.taskSize; id++) {
                if (Object.keys(this.data.labels[id]).length < this.taskInfo.numLabelsRequired) {
                    return false;
                }
            }
        }

        // try to find a consensus for each image, if one is found add it to the consensus labels
        const totalPayout = 0;
        for (let id = 0; id < this.taskSize; id++) {
            labelVotes = new Array(this.keySize).fill(0);
            for (let address in this.data.labels[id]) {
                labelVotes[this.data.labels[id][address]] += 1;
            }
            // add to consensus label list
            // TODO test with empty labels dict
            const consensusLabel = labelVotes.indexOf(Math.max(...labelVotes));
            consensusLabels[id] = consensusLabel;
            // add consensus labels to payout for that address
            for (let address in this.data.labels[id]) {
                if (this.data.labels[id][address] == consensusLabel) {
                    this.data.payout[address] += 1;
                    totalPayout += 1;
                }
            }
        }

        // normalise the payout
        for (let address in this.data.payout) {
            this.data.payout[address] /= totalPayout;
            this
        }

        console.log("Paying out contract");
        // send payout to contract
        // TODO write this function
        this.settleContract();

        if (notExpired) {
            this.info.status = 'completed';
        }
        else {
            this.info.status = 'expired';
        }

        return true;
    }

    settleContract() {
        // TODO should sync updates about contract funds from blockchain

        // iterate through payout and send funds*payout to each address
        for (let address in this.data.payout) {
            // TODO ethers.js code to send funds e.g.
            send(address, this.data.payout[address]*this.contract.funds);
        }
    }

}

const activeTasks = {};
const completedTasks = {};

// add an example task
activeTasks.push(new Task(
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
        status: 'active',
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
    const infoToDisplay = [];
    // show open tasks
    keys = Object.keys(activeTasks);
    for (let key of keys) {
        infoToDisplay.push(activeTasks[key].getTaskInfo());
    }
    // whether to also show completed tasks or not
    const showCompleted = req.params.showCompleted;
    if (showCompleted == 'true') {
        keys = Object.keys(completedTasks);
        for (let key of keys) {
        infoToDisplay.push(completedTasks[key].getTaskInfo());
        }
    }

    res.send({ infoToDisplay });
});

// create a new task
app.post('/tasks/create-task', (req, res) => {
    // TODO create contract on client side and send info here 
    const {taskInfo, contract, images} = req.body;
    const taskId = Date.now();    // TODO: decide what to make this
    // create the task
    active_tasks[taskId] = new Task(taskId, taskInfo, contract, images);
});


// TODO serve images in a random order to the front end inside a task
// TODO need some security so user's address is used (and verified) in the request - use metamask to provide credential check. 
// TODO need to make sure that the images are not repeated to the same user
app.get('tasks/get-task', (req, res) => {
    // TODO serve one image or a batch at a time, in order of least number of labels submitted. 
    const {labellerAddress} = req.body;
    const {taskId} = req.params;
    const task = active_tasks[taskId];

    // check that the task is active, not already done by user
    try {
        assert(task != undefined);
        assert(!task.data.labellers.includes(labellerAddress));
    }
    catch {
        //return an error
    }

    const imgs = task.data.images;
    const labels = task.info.labelOptions;

    // the images aren't shuffled as it will require some thinking about- do we want to keep track of the order
    // we sent the images to the client in? otherwise we need to provide them with a canonical id for each image
    // which would make the original order reconstructable by a determined group of labellers 
        // Yes - we keep track of labels given image IDs
    res.send( {imgs, labels} );
})


// submit labels to server after labelling in front end
// TODO need to encrypt this to send across internet?
// TODO need to prevent this from being submitted multiple times or 
// called directly without actually doing the labels (security), not important for now.
app.post('tasks/:taskId/submit-labels', (req, res) => {
    console.log('Received a batch of labels...');
    const {taskId} = req.params;
    // unpack request body (labels are a mapping(imageId => label))
    const {labellerAddress, labels} = req.body;
    // check task exists
    try {
        assert(taskId in active_tasks);
    }
    catch(err) {
        res.status(400).send('Active task not found');
        throw new Error('Task not found');  // needed?
    }
    // check all labels are valid
    try {
        for (let label of labels) {
            assert(labels[label] < task.keySize);
        }
    }
    catch(err) {
        res.status(400).send('Invalid label submitted');
        throw new Error('Invalid label');
    }

    const task = active_tasks[taskId];

    // add labels to task
    for (let imageId in labels) {
        // make the imageId object if it doesn't exist
        if (!(imageId in task.data.labels)) {
            task.data.labels[imageId] = {};
        }
        task.data.labels[imageId][labellerAddress] = labels[imageId];
    }

    // add the labeller to the list of labellers
    if (!(labellerAddress in task.data.labellers)) {
        task.data.labellers.push(labellerAddress);
    }

    // if enough labels have been submitted, complete the task
    if (task.computeConsenus()) {
        // add the task to the completed tasks
        completedTasks[taskId] = task;
        // remove the task from the active tasks
        delete activeTasks[taskId];
    }

});

// TODO expired tasks should be removed from the active tasks list and a partial consensus should be computed
// TODO need to regularly poll the blockchain for updates on the contract

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
