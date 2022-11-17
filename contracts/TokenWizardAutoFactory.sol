//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TokenWizardAuto.sol";


/**@author Rohan Nero
 * @notice this contract deploys TokenWizardAuto contracts and stores their addresses in an array
 */
contract TokenWizardAutoFactory {

    address[] public addressArray;

    /**@dev ContractCreated event emits with the array index your contract is located at and the newly created contract's address*/
    event ContractCreated(uint arrayIndex, address contractAddress);

    function createTokenWizardAutoContract(string memory uri, address payable borrower, address payable lender, TokenWizardAuto.FinancialTerms memory financialTerms, address priceFeed ) public {
        TokenWizardAuto tokenWizardAuto = new TokenWizardAuto(uri, borrower, lender, financialTerms, priceFeed);
        addressArray.push(address(tokenWizardAuto));
        emit ContractCreated(addressArray.length - 1, address(tokenWizardAuto));
    }
}