pragma solidity ^0.8.0;

/*
    

    major security flaw:
    Bring in safemath

    send the token when the loan is approved
    give the lender the ability to withdraw their money
    allow the borrower to cancel loan

    when checking the price create a function with params(_loanId) and saves the request Id 
*/

import "hardhat/console.sol";
import "./Token.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract LendingContract{
    using SafeMath for uint;

    struct loanStruct{
        address borrower; // borrowers address
        uint amount; // curent amount that the borrower has to pay back
        bool approved; // might change if the smart contract handles the transactions
        uint poolAmount; // the amount requested to borrow
        address erc20Token; // the address to the erc20 token
    }

    event funded(uint loanId, uint amount, address sender);

    uint public idIndex = 1; // change this to a different identifier

    mapping(uint => loanStruct) public loans;
    mapping(uint => mapping(address => uint)) public payments;
    uint[] public loansArray;
    mapping(uint => uint) public amountPayed; // mapping when the borrower pays back some of the loan

    modifier OnceLoanApproved(uint _loanId){
        require(loans[_loanId].approved == true, "The loan is not approved yet");
        _;
    }
    // change to internal so only the smart contract can communicate to request
    // have the user upload the nft item and calculate the price on the smart contract
    function requestData(uint _amount) internal{ 
        string memory name = Strings.toString(idIndex);
        LoanTokenERC loanToken = new LoanTokenERC(_amount, name); // to dillute shares divide add totalsupply - _amount

        loanStruct memory loanData = loanStruct(msg.sender, 0, false, _amount, address(loanToken));
        loans[idIndex] = loanData;
        loansArray.push(idIndex); 
        idIndex += 1;
        payments[idIndex][msg.sender] = 0;
    }

    // takes the contract address of the nft and checks the price
    function request(uint _amount) public{
        requestData(_amount);
    }

    function fund(uint _loanId) payable public{
        // approve the loan once the amount is equal to poolAmount
        require((loans[_loanId].amount + msg.value) <= loans[_loanId].poolAmount, "can't give the borrower more than the pool request");
        loans[_loanId].amount = loans[_loanId].amount + msg.value;
        payments[_loanId][msg.sender] = payments[_loanId][msg.sender] + msg.value;

        // gives the token to the funder
        LoanTokenERC token = LoanTokenERC(loans[_loanId].erc20Token);
        token.transfer(msg.sender, msg.value);

        emit funded(_loanId, msg.value, msg.sender);
        amountPayed[_loanId] = 0;
    }

    function pay(uint _loanId) payable public { // put the OnceLoanApproved(_loanId)
        require(loans[_loanId].borrower == msg.sender, "The person who pays back the loan must be the borrower");
        require(loans[_loanId].amount >= msg.value, "can't pay more than the amount");

        amountPayed[_loanId] = amountPayed[_loanId] + msg.value;
        loans[_loanId].amount = loans[_loanId].amount - msg.value;
    }

    function withdrawFundsLenderApproved(uint _loanId, uint _amount) external OnceLoanApproved(_loanId){
        // This function withdraws the funds for the lender once loan is approved
        require(_amount <= amountPayed[_loanId], "The borrower hasn't payed enough");
        LoanTokenERC token = LoanTokenERC(loans[_loanId].erc20Token);
        token.transferFrom(msg.sender, address(this), _amount);

        payable(msg.sender).transfer(_amount);


    }

    function withdrawAllFundsLender(uint _loanId) external{
        // This function withdraws the funds for the lender before the loan is approved
        // once loan is approved the lender can't withdraw all funds

        LoanTokenERC token = LoanTokenERC(loans[_loanId].erc20Token);
        uint total = token.balanceOf(msg.sender);
        //console.log("total balance: $s", total);
        token.transferFrom(msg.sender, address(this), total);

        payable(msg.sender).transfer(total);
        loans[_loanId].amount = loans[_loanId].amount - total;
        payments[_loanId][msg.sender] = 0;

    }

    function withdrawFunds(uint _loanId) external{
        // still needs to take the users erc20 tokens
        // check the users payments - total supply
        uint amount = payments[_loanId][msg.sender];
        
        require(amount > 0, "Insuffienct amount of funds");
        //require()
        payable(msg.sender).transfer(amount);
        payments[_loanId][msg.sender] = 0;
    }

    receive() payable external{
        emit funded(0, msg.value, msg.sender);
    }

}