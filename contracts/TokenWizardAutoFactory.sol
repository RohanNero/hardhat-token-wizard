//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TokenWizardAuto.sol";

contract TokenWizardAutoFactory {
    address[] public addressArray;
    function createTokenWizardAutoContract(string memory uri, address payable borrower, address payable lender, TokenWizardAuto.FinancialTerms memory financialTerms, address priceFeed ) public {
        TokenWizardAuto tokenWizardAuto = new TokenWizardAuto(uri, borrower, lender, financialTerms, priceFeed);
        addressArray.push(address(tokenWizardAuto));
    }
}