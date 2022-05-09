pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LoanTokenERC is ERC20{
    constructor(uint _initialSupply, string memory _loanId) ERC20(_loanId, "loan"){
        _mint(msg.sender, _initialSupply);
    }
}
