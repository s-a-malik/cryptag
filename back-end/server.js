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
const { ethers } = require('ethers');
require('dotenv').config();

// TODO add ABI to artifacts
const SettlementContract = require('../solidity/artifacts/contracts/Settlement.sol/Settlement.json');
const TaskContract = require('../solidity/artifacts/contracts/Task.sol/Task.json');
// TODO need to save private keys in .env
const provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const express = require('express');
const app = express();
const cors = require('cors');
const { assert } = require('console');
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
        // for async
        this.initContracts()
            .then(() => {
                console.log('registered')
            })
            .catch(console.error);

        this.keySize = Object.keys(taskInfo.labelOptions).length;
        this.taskSize = images.length;

        this.queue = [];
        this.labelsByItem = {};
        for (let ind = 0; ind < this.taskSize; ind++) {
            this.labelsByItem[ind] = 0;
            this.queue.push(ind);
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

    async initContracts() {
        this.taskContract = new ethers.Contract(
            this.contract.contractAddress,
            TaskContract.abi,
            wallet
        );
        const balance = await provider.getBalance(this.taskContract.address);
        console.log(balance);
        const settlementAddress = await this.taskContract.settlement();
        console.log(settlementAddress);
        this.settlementContract = new ethers.Contract(
            this.taskContract.settlement(),
            SettlementContract.abi,
            wallet,
        );
        // Register event listeners
        const settleEvent = {
            address: this.taskContract.address,
            topics: [
                ethers.utils.id('Settle(uint256)'),
            ]
        };
        const disperseEvent = {
            address: this.settlementContract.address,
            topics: [
                ethers.utils.id('Disperse(address,uint256)'),
            ]
        };
        const depositEvent = {
            address: this.taskContract.address,
            topics: [
                ethers.utils.id('Deposit(address,uint256)'),
            ]
        };
        provider.on(settleEvent, this.settleContract.bind(this));
        provider.on(disperseEvent, () => { console.log('disperse success!') });
        provider.on(depositEvent, this.updateAmount.bind(this));
    }

    updateAmount(address, amount) {
        this.contract.funds += amount;
        console.log('deposit of', amount, 'from', address);
    }

    async getBalance() {
        const balance = await provider.getBalance(this.taskContract.address);
        console.log( await this.taskContract.settlement());
        console.log(balance);
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
        for (let address of this.data.labellers) { this.data.payout[address] = 0; }

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
            for (const [address, label] of Object.entries(this.data.labels[id])) {
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
        console.log(`payout: ${JSON.stringify(this.data.payout)}`);
        console.log(`consensus labels: ${JSON.stringify(this.data.consensusLabels)}`);

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
        // const settlement = new ethers.Contract(this.contract.contractAddress, Settlement.abi, wallet);
        const tx = await this.taskContract.settle();
        await tx.wait();
        // should have sent funds to settlement contract now
        const contractBalance = await this.settlementContract.getBalance();
        console.log(contractBalance); // check settlement contract has received funds
        console.log(this.data.payout);

        // iterate through payout and send funds*payout to each address
        for (let address in this.data.payout) {
    
            // send funds to address
            const outAmount = this.data.payout[address] * contractBalance;
            console.log(`Payed out ${outAmount} to ${address}`);
            const tx = await this.settlementContract.disperse(address, ethers.utils.parseEther(`${outAmount}`));
            // console.log(tx); // will have the details of the transaction pre-mining. 
            await tx.wait();    // wait for the mine
            console.log(`Tx hash for sending payment to ${address}: ${tx.hash}`);
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
        this.queue = Object.keys(this.labelsByItem).map(function (key) {
            return [key, temp[key]];
        });
        this.queue.sort(function (a, b) { return a[1] - b[1]; });
        for (let x in this.queue) {
            this.queue[x] = this.queue[x][0];
        }
    }

    /*
    Returns the next image to be labelled given a labeller address
    */
    getImage(labellerAddress) {
        let seens = this.seen[labellerAddress];
        if (seens==undefined) {
            seens = [];
            this.seen[labellerAddress] = seens;
        }
        for (let id of this.queue) {
            if (!seens.includes(parseInt(id))) {
                this.seen[labellerAddress].push(parseInt(id));
                return [id, this.data.images[id]];
            }
        };
        return false;
    }

    /*
    Returns the images and consensus labels for a completed task
    */
    getResults() {
        return {
            images: this.data.images,
            consensusLabels: this.data.consensusLabels,
            payout: this.data.payout,
            labelOptions: this.taskInfo.labelOptions,
            funds: this.contract.funds,
        }
    }
}

// current and completed task objects for storage, to be indexed by taskId
const activeTasks = {};
const completedTasks = {};

// add example tasks
activeTasks[0] = new Task(
    0,
    {
        taskName: 'Dogs or Cats',
        taskDescription: 'Label which images are dogs and which are cats!',
        example: 'https://cdn.fotofits.com/petzlover/gallery/img/l/bengal-523511.jpg',
        numLabelsRequired: 3,
        labelOptions: {
            'Dog': 0,
            'Cat': 1
        },
        status: 'active',
    },
    {
        contractAddress: '0x7f31C0949B9d666D8d98253bB5C579AE28FC2e63',
        setter: '0x859E27407Ed7EA2FaBF8DAD193E4a0F83cFE6CcC',
        created: Date.now(),
        expiry: Date.now() + (1000 * 60 * 60 * 24 * 7),
        funds: 0.05,
    },
    [
        'https://wallpapersdsc.net/wp-content/uploads/2016/10/Boxer-Dog-High-Quality-Wallpapers.jpg',
        'https://www.hdnicewallpapers.com/Walls/Big/Dog/Beautiful_Dog_Puppy_4K_Wallpaper.jpg',
        'http://2.bp.blogspot.com/-Lx32UOXTRd0/UORN13Ku0WI/AAAAAAAASr8/XLQonS0USvg/s1600/Shetland_Sheepdog_Dog.jpg',
        'https://blogs.columbian.com/cat-tales/wp-content/uploads/sites/43/2017/02/cat-832583_1920.jpg',
        'https://2.bp.blogspot.com/-vIzVDMl7WcQ/TmDBPW82iCI/AAAAAAAADzo/jYZ0CQDrXzE/s1600/Orion+%25281%2529.JPG',
        'https://cdn.fotofits.com/petzlover/gallery/img/l/persian-811129.jpg'
    ]
);

// completedTasks[1] = new Task(
//     1,
//     {
//         taskName: 'Test Complete Task',
//         taskDescription: 'This is a test task',
//         example: 'https://picsum.photos/200',
//         numLabelsRequired: 3,
//         labelOptions: {
//             'road': 0,
//             'person': 1,
//             'field': 2
//         },
//         status: 'completed',
//     },
//     {
//         contractAddress: '0x0',
//         setter: '0x0',
//         created: Date.now(),
//         expiry: Date.now() + (1000 * 60 * 60 * 24 * 7),
//         funds: 1,
//     },
//     [
//         'https://picsum.photos/200',
//         'https://picsum.photos/300',
//         'https://picsum.photos/400',
//     ]
// );
// completedTasks[1].data = {
//     "images": completedTasks[1].data.images,
//     "consensusLabels": [0,1,0],
//     "payout": {
//         "0xegrioegn": 0.3,
//         "0xegw3224": 0.3,
//         "0xegw32reg4": 0.4
//     }
// }

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
    const showCompleted = req.query.showCompleted;
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
    const { taskInfo, contract, images } = req.body;
    const taskId = Date.now();    // TODO: decide what to make this
    // create the task
    activeTasks[taskId] = new Task(taskId, taskInfo, contract, images);
    
    // send the taskId back to the client
    res.send({ taskId });
});


// Serves an image to be labelled for a task given a taskId and labeller address
// TODO need some security so user's address is used (and verified) in the request - use metamask to provide credential check. 
app.get('/tasks/:taskId/get-next-image', (req, res) => {
    const {taskId} = req.params;
    const {labellerAddress} = req.query;
    console.log(`Getting next image for task ${taskId} for labeller ${labellerAddress}`);    

    const task = activeTasks[taskId];
    let send = {};

    // check that the task is active, not already done by user
    if (task == undefined) {
        res.status(400);
        send['error'] = 'Task does not exist';
    }
    let image = task.getImage(labellerAddress);
    console.log(`serving image ${image[0]}...`);

    if (image) {
        let labelOptions = task.taskInfo.labelOptions;
        send["image"] = image;
        send["labelOptions"] = labelOptions;
    }
    else {
        res.status(400);
        send["error"] = 'No available images';
    }
    res.send(send);
})


// submit labels to server after labelling in front end
// TODO is the the right place for async?
// TODO need to encrypt this to send across internet?
// TODO need to prevent this from being submitted multiple times or 
// called directly without actually doing the labels (security), not important for now.
app.post('/tasks/:taskId/submit-labels', async (req, res, next) => {
    const {taskId} = req.params;
    // unpack request body labels are list of tuples [imageId, labelId]
    const {labellerAddress, labels} = req.body;
    const send = {};
    console.log(`Labels received for task ${taskId} by labeller ${labellerAddress}`);
  
    let task = activeTasks[taskId];
    // check task exists
    if (task == undefined) {
        res.status(400);
        send['error'] = 'Task does not exist';
        // throw new Error('Task not found');
    }
    else {
        // check all labels are valid
        // try {
        for (let label of labels) {
            if (label[0] >= task.taskSize) {
                next(new Error("Image id out of range"));
                res.status(400);
                send["error"] = 'Image id out of range';
            };
            if (label[1] >= task.keySize) {
                next(new Error("Label id out of range"));
                res.status(400);
                send["error"] = "Label id out of range";
            };
        }

        task.pushLabels(labellerAddress, labels);

        // if enough labels have been submitted, complete the task
        if (task.computeConsenus()) {
            // add the task to the completed tasks
            completedTasks[taskId] = task;
            // remove the task from the active tasks
            delete activeTasks[taskId];
            send["completed"] = `true`;
        }
        else {
            send["complete"] = `false`
        };
    }
    // should send more info than this really
    res.send(send);

});


/*
Allow people to see the results of completed tasks
Currently an open source dataset as we allow funders to contribute but we could restrict this to only funders 
Returns an object of images list, labels list, and label options for the completed task
*/
app.get('/tasks/:taskId/results', (req, res) => {
    const {taskId} = req.params;
    const task = completedTasks[taskId];
    if (task == undefined) {
        res.status(400);
        const activeTask = activeTasks[taskId];
        if (activeTask == undefined) {
            res.send({'error': 'Task does not exist'});
            // throw new Error('Task not found');
        }
        else {
            res.send({'error': 'Task not complete'});
            // throw new Error('Task not complete');
        }
    }
    else {
        res.send(task.getResults());
    }
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
