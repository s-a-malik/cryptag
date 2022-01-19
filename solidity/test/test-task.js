const { ethers } = require('hardhat');
const { expect } = require('chai');

describe("Settlement", function () {
  let Settlement;
  let settlement;
  let owner;
  let addr;
  let addrs;

  beforeEach(async function () {
    Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy();
    await settlement.deployed();
    
    [owner, addr, ...addrs] = await ethers.getSigners();
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

    await settlement.connect(owner)
      .disperse(addr.address, ethers.utils.parseEther("0.1"));

    let newAddrBalance = await settlement.provider.getBalance(addr.address);
    newAddrBalance = Number(ethers.utils.formatEther(newAddrBalance));

    expect(newAddrBalance).to.be.greaterThan(addrBalance);
  })
});

describe("Task", function() {

  let Settlement;
  let settlement;
  let Task;
  let task
  let owner;
  let addr;
  let addrs;
  let getBalance;

  beforeEach(async function () {
    Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy();
    await settlement.deployed();

    Task = await ethers.getContractFactory("Task");
    task = await Task.deploy(settlement.address);
    await task.deployed();
    
    [owner, addr, ...addrs] = await ethers.getSigners();

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

    const settle = await task.connect(owner).settle();
    await settle.wait();

    const balance = await getBalance(settlement);
    expect(balance).to.be.greaterThan(0);

    taskBalance = await getBalance(task);
    expect(taskBalance).to.equal(0);
      
  });

})