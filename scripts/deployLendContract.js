
const hre = require("hardhat");


const main = async() => {
    var contractFactory = await hre.getContractFactory("LendingContract");
    var contractInstance = await contractFactory.deploy()

    await contractInstance.deployed()

    console.log("Greeter deployed to:", contractInstance.address);
}

main()