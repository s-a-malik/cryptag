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
- Listens for events from the smart contract and updates the database accordingly.

TODO:
- expired tasks should be removed from the active tasks list and a partial consensus should be computed
- listen for events from the contracts and update data accordingly e.g. when funds added
- Add a way to see progress of the consensus (% complete)/payouts for labellers
- Test everything
*/
import {ethers} from 'ethers';
require('dotenv').config();

// TODO add ABI to artifacts
import Settlement from './artifacts/contracts/Settlement.sol/Settlement';   


const express = require('express');
const app = express();
const cors = require('cors');
const { nextTick } = require('process');
const { assert } = require('console');
const port = 3042;

// TODO need to save private keys in .env
const provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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
    - labelOptions: dict of names of possible labels (keys) and their values (unique labelId)
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
    - consensusLabels: an array of labelIds for the consensus label of each image
    - payout: fractional payout per labeller (address => value) for each account (created when consensus is reached)  
*/
class Task {
    /*
    Parameters:
    - taskId: unique id for the task (same as index of the array) - get from length of array or random?
    - taskInfo (object): as described above
    - contract (object): as described above
    - images (array): an array of images to be displayed to the user (URLs for now)
    */
    constructor(taskId, taskInfo, contract, images) {
        this.taskId = taskId;
        this.taskInfo = taskInfo;
        this.contract = contract;

        this.keySize = Object.keys(taskInfo.labelOptions).length;
        this.taskSize = images.length;
       
        this.queue = [];
        this.labelsByItem = {};
        for (let ind = 0; ind < this.taskSize; ind++) {
            this.labelsByItem[ind] = 0;
            this.queue.push[ind];
        }
        this.seen = {};

        // initialize data
        this.data = {
            // imagesIds are the index of the array of images
            images: images,
            labels: {},  // empty dict to start. This will be mapping {imageId: {address: label}}
            labellers: [],
            consensusLabels: [],    // consensus labels for each image (indexed by imageId)
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
    TODO change to REP weighted.
    */
    computeConsenus() {
        // if called before enough labels are gathered and not called when expired, reject
        const notExpired = this.contract.expiry > Date.now();
        if (notExpired) {
            for (let id = 0; id < this.taskSize; id++) {
                if (Object.keys(this.data.labels[id]).length < this.taskInfo.numLabelsRequired) {
                    return false;
                }
            }
        }
        else {
            // TODO need to define default (un)label for expired task
        }

        // try to find a consensus for each image
        let totalPayout = 0;
        for (let address of this.data.labellers) {this.data.payout[address]=0;}

        // iterate through each image
        for (let id = 0; id < this.taskSize; id++) {
            // compute consensus
            // TODO test with empty labels dict for expired ones

            const labelVotes = new Array(this.keySize).fill(0);
            for (const [address, label] of Object.entries(this.data.labels[id])) {
                labelVotes[label] += 1;
            }
            const consensusLabel = labelVotes.indexOf(Math.max(...labelVotes));
            // add to consensus label list
            this.data.consensusLabels[id] = consensusLabel;
            // add consensus labels to payout for that address
            for (const [address, label] of Object.entries(this.data.labels[id]) ) {
                if (label == consensusLabel) {
                    this.data.payout[address] += 1;
                    totalPayout += 1;
                }
            }
        }

        // normalise the payout
        for (const [address, payout] of Object.entries(this.data.payout)) {
            this.data.payout[address] /= totalPayout;
        }

        // send payout to contract
        this.settleContract();

        // mark as completed or expired as appropriate
        if (notExpired) {
            this.taskInfo.status = 'completed';
        }
        else {
            this.taskInfo.status = 'expired';
        }

        return true;
    }

    // TODO is this to right way to do an async call?
    async settleContract() {
        // TODO should sync updates about contract funds from blockchain
        // TODO error catching
        console.log("Paying out contract");
        const settlement = new ethers.Contract(this.contract.contractAddress, Settlement.abi, wallet);

        // iterate through payout and send funds*payout to each address
        for (let address in this.data.payout) {
            // send funds to address
            const tx = await settlement.disperse(this.data.payout[address], ethers.utils.parseEther(`${this.data.payout[address]*this.contract.funds}`));
            // console.log(tx); // will have the details of the transaction pre-mining. 
            await tx.wait();    // wait for the mine
            console.log(`Tx hash for sending payment to ${this.data.payout[address]}: ${tx.hash}`);
        }
        console.log("settled!");
    }

    /*
    Adds labels to the task.
    Params:
    - labellerAddress: the address of the labeller
    - labels [n x 2]: n x 2 array of (imageId, labelId) pairs
    */
    pushLabels(labellerAddress, labels) {
        // add labels to task
        for (let label of labels) {
            // make the imageId object if it doesn't exist
            if (!(label[0] in this.data.labels)) {
                this.data.labels[label[0]] = {};
            }
            
            // check this labeller hasn't already labelled this image
            // if they have, just ignore it entirely for now
            if (this.data.labels[label[0]][labellerAddress] == undefined) {
                this.data.labels[label[0]][labellerAddress] = label[1];
                this.labelsByItem[label[0]] += 1;
            }
        }
        this.updateQueue();

        // add the labeller to the list of labellers
        if (!(this.data.labellers.includes(labellerAddress))) {
            this.data.labellers.push(labellerAddress);
        }
    }
    /*
    updates the queue of images to be labelled
    */
    updateQueue() {
        let temp = this.labelsByItem;
        this.queue = Object.keys(this.labelsByItem).map(function(key) {
            return [key, temp[key]];
        });
        this.queue.sort(function(a,b) {return a[1]-b[1];});
        for (let x in this.queue) {
            this.queue[x] = this.queue[x][0];
        }
    }

    /*
    Returns the next image to be labelled given a labeller address
    */
    getImage(labellerAddress) {
        seens = this.seen[labellerAddress];
        if (seens==undefined) {
            seens = [];
            this.seen[labellerAddress] = seens;
        }

        for (let id of this.queue) {
            if (!seens.includes(parseInt(id))) {
                this.seen[labellerAddress].push(parseInt(id));
                return [id, this.data.images[id]];}
        };
        return false;
    }

}

// current and completed task objects for storage, to be indexed by taskId
const activeTasks = {};
const completedTasks = {};

// add an example task
activeTasks[0] = new Task(
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
);

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


// Serves an image to be labelled for a task given a taskId and labeller address
// TODO need some security so user's address is used (and verified) in the request - use metamask to provide credential check. 
app.get('tasks/:taskid/get-next-image', (req, res) => {
    const {labellerAddress} = req.body;
    const {taskId} = req.params;
    const task = active_tasks[taskId];

    // check that the task is active, not already done by user
    try {
        assert(task != undefined);
    }
    catch(err) {
        res.status(400).send('Active task not found');
        throw new Error('Task not found');  // needed?
    }
    let image = task.getImage(labellerAddress);

    if (image != false) {
        let labelOptions = task.data.labelOptions
        res.send( {image, labelOptions} );
    }
    else {
        // res.send( {'error': 'no available images'} );
        res.status(400).send('No available images');
        throw new Error('No available images');
    }
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
        assert(taskId in activeTasks);
    }
    catch(err) {
        res.status(400).send('Active task not found');
        throw new Error('Task not found');  // needed?
    }

    let task = activeTasks[taskId];
    // check all labels are valid
    try {
        for (let label of labels) {
            assert(label[0] < task.taskSize);
            assert(label[1] < task.keySize);
        }
    }
    catch(err) {
        res.status(400).send('Invalid label submitted');
        throw new Error('Invalid label');
    }

    task.pushLabels(labellerAddress, labels);

    // if enough labels have been submitted, complete the task
    if (task.computeConsenus()) {
        // add the task to the completed tasks
        completedTasks[taskId] = task;
        // remove the task from the active tasks
        delete activeTasks[taskId];
        }


});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
