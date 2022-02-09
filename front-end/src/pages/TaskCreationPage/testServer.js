import fetch from "node-fetch";

async function test(){
const backendURL = 'http://localhost:3042';
  const contractObject = {
    contractAddress : '0x',
    setter : '0x',
    created : Date.now(),
    expiry : Date.now() + 1,
    funds : '0.01'
    };

  const taskInfo = {
    taskName : 'test',
    taskDesription : 'test',
    example : 'www.test.com',
    numLabelsRequired : 1,
    labelOptions : '', 
    status : "active"
   }
    // convert images to array
    let imagesArray = ['test.com','test.com']
    const data  = {
    contractObject : contractObject,
    taskInfo : taskInfo,
    images : imagesArray
    }
  const requestURL = backendURL + '/tasks/create-task'
    const rawResponse = await fetch(requestURL, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    const content = await rawResponse.json();
    console.log(content);
}
test();
