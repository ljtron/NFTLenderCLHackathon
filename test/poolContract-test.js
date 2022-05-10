
const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Pool money", function () {

    let contractInstance;
    let owner;
    let addresses;
    const provider = waffle.provider;
    let loanTokenContract;

    before(async function () {
        [owner, ...addresses] = await ethers.getSigners();
        const contractFactory = await ethers.getContractFactory("LendingContract");
        contractInstance = await contractFactory.deploy()
        await contractInstance.deployed();

        console.log("contract address:", contractInstance.address)
    });

    it("send contract money", async function(){
        console.log(addresses[2].address)
        await addresses[2].sendTransaction({
            to: contractInstance.address,
            value: ethers.utils.parseEther("1.0")
        })

        console.log("smart contract balance: " + (await provider.getBalance(contractInstance.address)).toString())
    })

    it("another random test", async function(){
        console.log("smart contract balance: " + (await provider.getBalance(contractInstance.address)).toString())
    })


    describe("interacting with loan contract", function(){
        it("make loan request", async function(){
            // Here the owner of the contract is making a request for a loan
            // Here we are checking if the request went though


            await contractInstance.request(ethers.utils.parseEther("1.0"))
            var result = await contractInstance.loans(1)
            console.log(result)
            expect(result.borrower).to.equal(owner.address)
        })
    
        it("fund project", async function(){

            // The third address in addresses is funding the loan request
            // We are checking if the third address funded the project or not by checking payments

            await contractInstance.connect(addresses[2]).fund(1, {value: ethers.utils.parseEther("1.0")})
            var result = await contractInstance.payments(1, addresses[2].address)
            console.log(result)
            expect(result).to.equal(ethers.utils.parseEther("1.0"))

            var data = await contractInstance.loans(1)
            console.log(data)
            expect(data.approved).to.equal(true)
        })
    
        // it("Withdraw funds", async function(){
        //     await contractInstance.withdrawFunds(1)
        //     var result = await contractInstance.payments(1, owner.address)
        //     console.log(result)
        //     expect(result).to.equal(ethers.utils.parseEther("0"))
        // })
    
        it("get the token data amount", async function(){

            // In this test we are checking if the token was created 
            // checking if it was sent to the right person


            var contractFactory = await ethers.getContractFactory("LoanTokenERC");
            //loanTokenContract = await contractFactory.attach()
    
            var result = await contractInstance.loans(1)
            loanTokenContract = await contractFactory.attach(result.erc20Token)
            var data = await loanTokenContract.balanceOf(addresses[2].address)
            expect(data).to.equal(ethers.utils.parseEther("1"))

            //console.log(result)
        })

        it("pay", async function(){
            await expect(contractInstance.connect(addresses[1]).pay(1, {value: ethers.utils.parseEther("1")})).to.be.revertedWith("The borrower of the loan must call this function");
             
            await contractInstance.pay(1, {value: ethers.utils.parseEther("1")})
            var result = await contractInstance.loans(1)
            //console.log(result)
            expect(result.amount).to.equal(ethers.utils.parseEther("0"))
            await expect(contractInstance.pay(1, {value: ethers.utils.parseEther("1")})).to.be.revertedWith("can't pay more than the amount");

        })

    })

    describe("testing withdraws", function(){
        let loanId = 2;
        it("make loan request", async function(){
            // Here the owner of the contract is making a request for a loan
            // Here we are checking if the request went though


            await contractInstance.request(ethers.utils.parseEther("1.0"))
            var result = await contractInstance.loans(loanId)
            console.log(result)
            expect(result.borrower).to.equal(owner.address)
        })
    
        it("fund project", async function(){

            // The third address in addresses is funding the loan request
            // We are checking if the third address funded the project or not by checking payments

            await contractInstance.connect(addresses[2]).fund(loanId, {value: ethers.utils.parseEther("0.50")})
            var result = await contractInstance.payments(loanId, addresses[2].address)
            console.log(result)
            expect(result).to.equal(ethers.utils.parseEther("0.50"))
        })

        it("Withdraw funds before approval", async function(){
            var contractFactory = await ethers.getContractFactory("LoanTokenERC");
            //loanTokenContract = await contractFactory.attach()
    
            var result = await contractInstance.loans(loanId)
            loanTokenContract = await contractFactory.attach(result.erc20Token)
            var data = await loanTokenContract.balanceOf(addresses[2].address)
            console.log(data)
            await loanTokenContract.connect(addresses[2]).approve(contractInstance.address, data);

            await contractInstance.connect(addresses[2]).withdrawAllFundsLender(loanId)
            var result = await contractInstance.loans(loanId)
            console.log(result)
            expect(result.amount).to.equal(ethers.utils.parseEther("0"))
        })
    })

});