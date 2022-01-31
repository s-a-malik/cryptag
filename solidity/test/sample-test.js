const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});

describe("Greeter", function () {
  it("Should transfer money to contract", async function () {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Bonjour a tout le monde");
    await greeter.deployed();

    const [owner, addr] = await ethers.getSigners();

    console.log(`addr: ${await greeter.provider.getBalance(addr.address)}`)

    console.log(`greeter: ${await greeter.provider.getBalance(greeter.address)}`);

    await greeter.connect(addr).deposit({value: ethers.utils.parseEther("1")});

    console.log(`greeter: ${await greeter.provider.getBalance(greeter.address)}`);

    // const tx = await greeter.settle(addr.address, {value: ethers.utils.parseEther("0.1")});
    const tx = await greeter.settle(addr.address, {value: ethers.utils.parseEther("0.1")});
    await tx.wait();

    console.log(`greeter: ${await greeter.provider.getBalance(greeter.address)}`);
    console.log(`addr: ${await greeter.provider.getBalance(addr.address)}`);
  })
})