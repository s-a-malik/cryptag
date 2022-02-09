const { ethers } = require('hardhat');
const { expect } = require('chai');
require('dotenv').config();
const numberSort = (x, y) => Number(x) - Number(y);
const isNumber = (x) => !isNaN(Number(x));
const toArray = (x) => Object.keys(x).filter(isNumber).sort(numberSort).reduce((a, k) => a.concat(x[k]), []);

describe("Settlement", function () {
  let Settlement;
  let settlement;
  let owner;
  let settler;
  let addr;
  let addrs;

  beforeEach(async function () {
    Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy();
    await settlement.deployed();
    [owner, addr, ...addrs] = await ethers.getSigners();
    console.log(process.env.PRIVATE_KEY);
    settler = new ethers.Wallet(process.env.PRIVATE_KEY, settlement.provider);
    await settlement.provider.send('hardhat_setBalance', [
      settler.address,
      "0x1000000000000000000000", // 1000 ETH
    ])
  });

  it("should receive funds", async function () {

    expect(await settlement.provider.getBalance(settlement.address))
      .to.equal("0");
    
    const sendFunds = await settlement.connect(addr)
      .deposit({value: ethers.utils.parseEther("0.1")});
    await sendFunds.wait();

    let balance = await settlement.provider.getBalance(settlement.address)
    balance = Number(ethers.utils.formatEther(balance));
    expect(balance).to.be.greaterThan(0);

  });

  it("should disperse funds", async function () {

    let addrBalance = await settlement.provider.getBalance(addr.address);
    addrBalance = Number(ethers.utils.formatEther(addrBalance));

    await settlement.connect(addrs[0])
      .deposit({value: ethers.utils.parseEther("1")});

    await settlement.connect(settler)
      .disperse(addr.address, ethers.utils.parseEther("0.1"));

    let newAddrBalance = await settlement.provider.getBalance(addr.address);
    newAddrBalance = Number(ethers.utils.formatEther(newAddrBalance));

    expect(newAddrBalance).to.be.greaterThan(addrBalance);
  })

  it("should emit a disperse event", async function () {

    await settlement.connect(addrs[0])
      .deposit({value: ethers.utils.parseEther("1")}); 
    const response = await settlement.connect(settler)
      .disperse(addr.address, ethers.utils.parseEther("0.1")); 
    const logs = await response.wait() 
    const disperse = logs.events.find(x => x.event === "Disperse");
    expect(disperse, "Expected a Disperse event to be emitted!").not.to.equal(undefined);
    const returnValues = toArray(disperse.args);
    expect(returnValues.length, "Expected two event values to be emitted!").to.equal(2);
    expect(returnValues[0], "Expected the first return value to be the address of the receiver.").to.equal(addr.address);
    expect(returnValues[1], "Expected the second return value to be the amount dispersed.").to.equal(ethers.utils.parseEther("0.1"));
  })

  it("should emit a deposit event", async function () {
    const response = await settlement.connect(addr)
    .deposit({value: ethers.utils.parseEther("0.1")});
    const logs = await response.wait() 
    const deposit = logs.events.find(x => x.event === "Deposit");
    expect(deposit, "Expected a Deposit event to be emitted!").not.to.equal(undefined);
    const returnValues = toArray(deposit.args);
    expect(returnValues.length, "Expected two event values to be emitted!").to.equal(2);
    expect(returnValues[0], "Expected the first return value to be the address of the depositer.").to.equal(addr.address);
    expect(returnValues[1], "Expected the second return value to be the amount deposited.").to.equal(ethers.utils.parseEther("0.1"));
  })

  it('should revert if the transaction fails', async () => {
    let ex;
    try {
      await settlement.connect(settler)
      .disperse(addr.address, ethers.utils.parseEther("0.1")); 
    }
    catch(_ex) {
        ex = _ex;
    }
    expect(ex, "Expected the transaction to revert! The contract does not have any funds to disperse.").not.to.equal(undefined);
  });
});

describe("Task", function() {

  let Settlement;
  let settlement;
  let Task;
  let task
  let owner;
  let settler;
  let addr;
  let addrs;
  let getBalance;

  beforeEach(async function () {
    Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy();
    await settlement.deployed();

    Task = await ethers.getContractFactory("Task");
    console.log(settlement.address);
    task = await Task.deploy(settlement.address);
    await task.deployed();
    
    [owner, addr, ...addrs] = await ethers.getSigners();
    settler = new ethers.Wallet(process.env.PRIVATE_KEY, settlement.provider);
    await settlement.provider.send('hardhat_setBalance', [
      settler.address,
      "0x1000000000000000000000", // 1000 ETH
    ])
    getBalance = async (acct) => {
      return Number(
        ethers.utils.formatEther(
          await settlement.provider.getBalance(acct.address)
        )
      )
    }
  });

  it('should send funds to the sister contract', async function () {

    await (await task.connect(addrs[0])
      .deposit({value: ethers.utils.parseEther("1")}))
      .wait();

    let taskBalance = await getBalance(task);
    expect(taskBalance).to.be.greaterThan(0);

    const settle = await task.connect(settler).settle();
    await settle.wait();

    const balance = await getBalance(settlement);
    expect(balance).to.be.greaterThan(0);

    taskBalance = await getBalance(task);
    expect(taskBalance).to.equal(0);
      
  });

  it("should get settlement address", async function () {
    const settlementAddress = await task.settlement();
    expect(settlementAddress).to.equal(settlement.address);
  })

  it("should emit a Settle event", async function () {
    await (await task.connect(addrs[0])
      .deposit({value: ethers.utils.parseEther("1")}))
      .wait();
    const response = await task.connect(settler).settle();
    const logs = await response.wait();
    const settle = logs.events.find(x => x.event === "Settle");
    expect(settle, "Expected a Settle event to be emitted!").not.to.equal(undefined);
    const returnValues = toArray(settle.args);
    expect(returnValues.length, "Expected one event value to be emitted!").to.equal(1);
    expect(returnValues[0], "Expected the first return value to be the funds settled.").to.equal(ethers.utils.parseEther("1"));
  })

  it("should emit a deposit event", async function () {
    const response = await task.connect(addr)
    .deposit({value: ethers.utils.parseEther("0.1")});
    const logs = await response.wait() 
    const deposit = logs.events.find(x => x.event === "Deposit");
    expect(deposit, "Expected a Deposit event to be emitted!").not.to.equal(undefined);
    const returnValues = toArray(deposit.args);
    expect(returnValues.length, "Expected two event values to be emitted!").to.equal(2);
    expect(returnValues[0], "Expected the first return value to be the address of the depositer.").to.equal(addr.address);
    expect(returnValues[1], "Expected the second return value to be the amount deposited.").to.equal(ethers.utils.parseEther("0.1"));
  })

})
