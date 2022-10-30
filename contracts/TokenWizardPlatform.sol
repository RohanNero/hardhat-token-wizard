// //SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

// import "hardhat/console.sol";

// error TokenWizard__UserIsntInvolved(
//     uint48 contractId,
//     address borrower,
//     address lender,
//     address user
// );
// error TokenWizard__ContractAlreadyApproved(uint256 contractId);
// error TokenWizard__BorrowerCantBeLender(address borrower, address lender);
// error TokenWizard__FinancialArrayLengthsNotEqual(
//     uint16 paymentAmountsArrayLength,
//     uint16 paymentDatesArrayLength
// );

// contract TokenWizard {
//     // need a function where users can tokenize objects they own
//     // function where users can create borrow-lend agreement and set: borrow amount, interest rate, and repayment due date.
//     // I also want to have optional minimum payments towards borrowed amount.
//     // And if user doesn't pay the minimum the entire balance can be due within 7 days.

//     uint48 public contractIdentifier;
//     mapping(uint48 => Contract) public idToContract; ///@dev id is short for 'contractId' from inside Contract struct
//     mapping(uint48 => ApprovalStatus) public idToApprovalStatus; ///@dev 0 = no approval, 1 = one party approved, 2 = both parties approved
//     mapping(address => UserInfo) public addressToUserInfo; ///@dev user address to struct containing user info (3 uint)

//     //Contract[] public pendingContractArray; ///@dev chainlink automation will reset pendingContract array every x

//     Contract[] public contractArray; ///@dev array of approved contracts

//     struct ApprovalStatus {
//         bool borrowerApproved;
//         bool lenderApproved;
//     }

//     struct UserInfo {
//         uint24 reputation;
//         uint16 completedContracts;
//         uint24 numOfLatePayments;
//         /* array of contractId's */
//         uint48[] contractsAsBorrower;
//         uint48[] contractsAsLender;
//     }

//     struct FinancialTerms {
//         uint32 borrowAmount; ///@dev amount of liquidity being borrowed
//         uint8 interestRate; ///@dev interest rate on the borrowed liquidity
//         uint32 interestCompoundingInterval; ///@dev interest compounding time interval in seconds
//         uint32 dueDate; ///@dev unix timestamp
//         uint8 lateFeePercent; ///@dev percentage used to caluclate how much is charged if payment is late
//         uint32 lateFeeCompoundingInterval; ///@dev late fee compounding time interval in seconds
//         //uint16 numOfMinimumPayments; ///@dev quantity of payments to be made
//         uint32[] paymentAmounts; ///@dev array of amounts corresponding to payment dates
//         uint32[] paymentDates; ///@dev array of unix timestamps representing when payments will be due
//     }

//     struct Contract {
//         string objectURI; ///@dev similar to NFT URI, this points to JSON containing a name, description, and an imageURI
//         address borrower; ///@dev user who is listing their physical item as collateral to borrow liquidity from a lender
//         address lender; ///@dev user who is lending liquidity to the borrower
//         uint48 contractId; ///@dev to help reference and keep track of each contract
//         uint32 amountOwed; ///@dev uint representing amount borrower still owes to the lender (updated daily from interest with chainlink)
//         FinancialTerms financialTerms; ///@dev FinancialTerms struct containing atleast 8 uints detailing terms of contract
//     }

//     event ContractDrafted(
//         uint48 indexed contractId,
//         address indexed borrower,
//         address indexed lender
//     );
//     event ContractApproved(uint48 contractId, address approver);

//     constructor() {}

//     ///@dev creates Contract object and pushes it into pendingContractArray
//     function createContract(
//         string memory _objectUri,
//         address borrower,
//         address lender,
//         FinancialTerms memory financialTerms
//     ) public returns (uint256 pendingContractArrayIndex) {
//         if (borrower == lender) {
//             revert TokenWizard__BorrowerCantBeLender(borrower, lender);
//         }
//         if (
//             financialTerms.paymentAmounts.length !=
//             financialTerms.paymentDates.length
//         ) {
//             revert TokenWizard__FinancialArrayLengthsNotEqual(
//                 uint16(financialTerms.paymentAmounts.length),
//                 uint16(financialTerms.paymentDates.length)
//             );
//         }
//         Contract memory newContract = Contract(
//             _objectUri,
//             borrower,
//             lender,
//             contractIdentifier,
//             financialTerms.borrowAmount,
//             financialTerms
//         );
//         idToContract[contractIdentifier] = newContract;
//         //pendingContractArray.push(newContract);
//         if (msg.sender == borrower) {
//             idToApprovalStatus[contractIdentifier] = ApprovalStatus(
//                 true,
//                 false
//             );
//         } else if (msg.sender == lender) {
//             idToApprovalStatus[contractIdentifier] = ApprovalStatus(
//                 false,
//                 true
//             );
//         }
//         contractIdentifier++;
//         emit ContractDrafted(
//             newContract.contractId,
//             newContract.borrower,
//             newContract.lender
//         );
//         pendingContractArrayIndex = contractIdentifier - 1;
//         //pendingContractArrayIndex = pendingContractArray.length - 1;
//     }

//     //function tokenize(string memory contractURI) public {}
//     ///@dev approving the existing contract using array index instead of contractId
//     /// because waiting to store only approved contracts in the mapping will save gas
//     function approvePendingContract(uint48 _contractId) public {
//         Contract memory pendingContract = idToContract[_contractId];
//         if (
//             msg.sender != pendingContract.borrower &&
//             msg.sender != pendingContract.lender
//         ) {
//             revert TokenWizard__UserIsntInvolved(
//                 pendingContract.contractId,
//                 pendingContract.borrower,
//                 pendingContract.lender,
//                 msg.sender
//             );
//         } else {
//             if (
//                 (msg.sender == pendingContract.borrower &&
//                     idToApprovalStatus[pendingContract.contractId]
//                         .borrowerApproved ==
//                     true) ||
//                 (msg.sender == pendingContract.lender &&
//                     idToApprovalStatus[pendingContract.contractId]
//                         .lenderApproved ==
//                     true)
//             ) {
//                 revert TokenWizard__ContractAlreadyApproved(
//                     pendingContract.contractId
//                 );
//             } else if (
//                 idToApprovalStatus[pendingContract.contractId]
//                     .borrowerApproved ==
//                 false &&
//                 idToApprovalStatus[pendingContract.contractId].lenderApproved ==
//                 false
//             ) {
//                 if (msg.sender == pendingContract.borrower) {
//                     idToApprovalStatus[pendingContract.contractId]
//                         .borrowerApproved = true;
//                 } else {
//                     idToApprovalStatus[pendingContract.contractId]
//                         .lenderApproved = true;
//                 }
//                 emit ContractApproved(pendingContract.contractId, msg.sender);
//             } else if (msg.sender == pendingContract.borrower) {
//                 idToApprovalStatus[pendingContract.contractId]
//                     .borrowerApproved = true;
//                 contractArray.push(pendingContract);
//                 addressToUserInfo[pendingContract.borrower]
//                     .contractsAsBorrower
//                     .push(pendingContract.contractId);
//                 addressToUserInfo[pendingContract.lender]
//                     .contractsAsLender
//                     .push(pendingContract.contractId);
//                 //idToContract[pendingContract.contractId] = pendingContract;
//                 emit ContractApproved(pendingContract.contractId, msg.sender);
//             } else if (msg.sender == pendingContract.lender) {
//                 idToApprovalStatus[pendingContract.contractId]
//                     .lenderApproved = true;
//                 contractArray.push(pendingContract);
//                 addressToUserInfo[pendingContract.borrower]
//                     .contractsAsBorrower
//                     .push(pendingContract.contractId);
//                 addressToUserInfo[pendingContract.lender]
//                     .contractsAsLender
//                     .push(pendingContract.contractId);
//                 //idToContract[pendingContract.contractId] = pendingContract;
//                 emit ContractApproved(pendingContract.contractId, msg.sender);
//             }
//         }
//     }

//     // view/pure functions

//     function getContractArrayLength() public view returns (uint256) {
//         return contractArray.length;
//     }

//     ///@dev These view functions are personal to each individual user (use msg.sender)
//     function viewTotalAmountYouOwe() public view returns (uint32) {
//         uint32 totalAmountOwed;
//         for (
//             uint256 i = 0;
//             i < addressToUserInfo[msg.sender].contractsAsBorrower.length;
//             i++
//         ) {
//             totalAmountOwed += idToContract[
//                 addressToUserInfo[msg.sender].contractsAsBorrower[i]
//             ].amountOwed;
//         }
//         return totalAmountOwed;
//     }

//     function viewTotalAmountOwedToYou() public view returns (uint32) {
//         uint32 totalAmountOwed;
//         for (
//             uint256 i = 0;
//             i < addressToUserInfo[msg.sender].contractsAsLender.length;
//             i++
//         ) {
//             totalAmountOwed += idToContract[
//                 addressToUserInfo[msg.sender].contractsAsLender[i]
//             ].amountOwed;
//         }
//         return totalAmountOwed;
//     }

//     function viewNextPaymentInfo(uint48 _contractId)
//         public
//         view
//         returns (uint32 nextPaymentAmount, uint32 nextPaymentDate)
//     {
//         uint32[2] memory paymentInfo;
//         for (
//             uint256 i = 0;
//             i < idToContract[_contractId].financialTerms.paymentAmounts.length;
//             i++
//         ) {
//             if (
//                 idToContract[_contractId].financialTerms.paymentDates[i] >
//                 block.timestamp &&
//                 paymentInfo[0] == 0
//             ) {
//                 paymentInfo[0] = idToContract[_contractId]
//                     .financialTerms
//                     .paymentAmounts[i];
//                 paymentInfo[1] = idToContract[_contractId]
//                     .financialTerms
//                     .paymentDates[i];
//             }
//         }
//         return (paymentInfo[0], paymentInfo[1]);
//     }

//     function viewBorrowerContract(uint48 index)
//         public
//         view
//         returns (Contract memory)
//     {
//         return
//             idToContract[
//                 addressToUserInfo[msg.sender].contractsAsBorrower[index]
//             ];
//     }

//     function viewLenderContract(uint48 index)
//         public
//         view
//         returns (Contract memory)
//     {
//         return
//             idToContract[
//                 addressToUserInfo[msg.sender].contractsAsLender[index]
//             ];
//     }

//     function viewNumOfActiveBorrowerContracts() public view returns (uint48) {
//         uint48 numOfActiveBorrowerContracts;
//         for (
//             uint256 i = 0;
//             i < addressToUserInfo[msg.sender].contractsAsBorrower.length;
//             i++
//         ) {
//             if (
//                 idToContract[
//                     addressToUserInfo[msg.sender].contractsAsBorrower[i]
//                 ].amountOwed > 0
//             ) {
//                 numOfActiveBorrowerContracts++;
//             }
//         }
//         return numOfActiveBorrowerContracts;
//     }

//     function viewNumOfActiveLenderContracts() public view returns (uint48) {
//         uint48 numOfActiveLenderContracts;
//         for (
//             uint256 i = 0;
//             i < addressToUserInfo[msg.sender].contractsAsLender.length;
//             i++
//         ) {
//             if (
//                 idToContract[addressToUserInfo[msg.sender].contractsAsLender[i]]
//                     .amountOwed > 0
//             ) {
//                 numOfActiveLenderContracts++;
//             }
//         }
//         return numOfActiveLenderContracts;
//     }
// }
