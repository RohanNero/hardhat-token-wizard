//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "hardhat/console.sol";

error TokenWizard__InvalidCallerAddress(
    address borrower,
    address lender,
    address user
);
error TokenWizard__AlreadyApprovedContract();
error TokenWizard__BorrowerCantBeLender(address borrower, address lender);
error TokenWizard__PaymentArrayLengthsNotEqual(
    uint16 paymentAmountsArrayLength,
    uint16 paymentDatesArrayLength
);
error TokenWizard__ProposerCannotApprove(address proposer);
error TokenWizard__CannotChangeBorrowAmount(
    uint32 borrowAmount,
    uint32 revisedBorrowAmount
);
error TokenWizard__OncePerHour(uint16 secondsRemaining);
error TokenWizard__NoFinancialRevisionPending();


/**@title platform for creating financialContracts using physical objects as collateral
   @author Rohan Nero */
contract TokenWizard {
    // need a function where users can tokenize objects they own
    // function where users can create borrow-lend agreement and set: borrow amount, interest rate, and repayment due date.
    // I also want to have optional minimum payments towards borrowed amount.
    // And if user doesn't pay the minimum the entire balance can be due within 7/x days.

    /** type declarations and state variables */
    address private proposer;
    bool private borrowerApproved;
    bool private lenderApproved;
    uint32 private lastProposalTimestamp;
    uint24 private numOfLatePayments;
    Contract private twContract;
    FinancialTerms private revisedFinancialTerms;

    struct FinancialTerms {
        uint32 borrowAmount; ///@dev amount of liquidity being borrowed
        uint8 interestRate; ///@dev interest rate on the borrowed liquidity
        uint32 interestCompoundingInterval; ///@dev interest compounding time interval in seconds
        uint32 dueDate; ///@dev unix timestamp
        uint8 lateFeePercent; ///@dev percentage used to caluclate how much is charged if payment is late
        uint32 lateFeeCompoundingInterval; ///@dev late fee compounding time interval in seconds
        uint32[] paymentAmounts; ///@dev array of amounts corresponding to payment dates
        uint32[] paymentDates; ///@dev array of unix timestamps representing when payments will be due
    }

    struct Contract {
        string objectURI; ///@dev similar to NFT URI, this points to JSON containing a name, description, and an imageURI
        address borrower; ///@dev user who is listing their physical item as collateral to borrow liquidity from a lender
        address lender; ///@dev user who is lending liquidity to the borrower
        uint32 amountOwed; ///@dev uint representing amount borrower still owes to the lender (updated daily from interest with chainlink)
        FinancialTerms financialTerms; ///@dev FinancialTerms struct containing atleast 8 uints detailing terms of contract
    }

    /** events and modifiers */

    event ContractDrafted(
        uint48 indexed borrowAmount,
        address indexed borrower,
        address indexed lender
    );
    event ContractApproved(address approver);
    event RevisedFinancialTermsProposed(
        address proposer,
        FinancialTerms newFinancialTerms
    );
    event ContractFinancialTermsRevised(
        FinancialTerms oldTerms,
        FinancialTerms newTerms
    );

    modifier onlyInvolvedParties() {
        if (
            msg.sender != twContract.borrower && msg.sender != twContract.lender
        ) {
            revert TokenWizard__InvalidCallerAddress(
                twContract.borrower,
                twContract.lender,
                msg.sender
            );
        }
        _;
    }

    modifier oncePerHour() {
        if (
            msg.sender == proposer &&
            block.timestamp - lastProposalTimestamp < 3600
        ) {
            revert TokenWizard__OncePerHour(
                uint16(3600 - (block.timestamp - lastProposalTimestamp))
            );
        }
        _;
    }

    /** constructor and main functions */

    /** @notice users have ability to pass in a variety of arguments to customize the contract terms to fit their needs
      string objectUri: URI with name, description, and image uri  (basically an NFT URI but without actually implementing ERC721) 
      address borrower: address of the user borrowing liquidity by using their physical object as collateral  
      address lender: address of the user lending their liqudity. (receives interest if applicable) 
      FinancialTerms: struct of uints representing the financial terms of the contract  */
    constructor(
        string memory _objectUri,
        address borrower,
        address lender,
        FinancialTerms memory financialTerms
    ) {
        if (borrower == lender) {
            revert TokenWizard__BorrowerCantBeLender(borrower, lender);
        }
        if (
            financialTerms.paymentAmounts.length !=
            financialTerms.paymentDates.length
        ) {
            revert TokenWizard__PaymentArrayLengthsNotEqual(
                uint16(financialTerms.paymentAmounts.length),
                uint16(financialTerms.paymentDates.length)
            );
        }
        twContract = Contract(
            _objectUri,
            borrower,
            lender,
            financialTerms.borrowAmount,
            financialTerms
        );
        if (msg.sender == borrower) {
            borrowerApproved = true;
        } else if (msg.sender == lender) {
            lenderApproved = true;
        }
        emit ContractDrafted(
            twContract.amountOwed,
            twContract.borrower,
            twContract.lender
        );
    }

    /** @notice proof that both parties agree to contract terms on-chain.
      @dev setting borrowerApproved/lenderApproved bool to true */
    function approveContract() public onlyInvolvedParties {
        if (
            (msg.sender == twContract.borrower && borrowerApproved == true) ||
            (msg.sender == twContract.lender && lenderApproved == true)
        ) {
            revert TokenWizard__AlreadyApprovedContract();
        } else if (borrowerApproved == false && lenderApproved == false) {
            if (msg.sender == twContract.borrower) {
                borrowerApproved = true;
            } else {
                lenderApproved = true;
            }
            emit ContractApproved(msg.sender);
        } else if (msg.sender == twContract.borrower) {
            borrowerApproved = true;
            emit ContractApproved(msg.sender);
        } else if (msg.sender == twContract.lender) {
            lenderApproved = true;
            emit ContractApproved(msg.sender);
        }
    }

    /** @notice this function allows borrower/lender to propose a change to the twContract's financialTerms */
    function proposeFinancialTermsRevision(FinancialTerms memory financialTerms)
        public
        onlyInvolvedParties
        oncePerHour
    {
        if (
            financialTerms.borrowAmount !=
            twContract.financialTerms.borrowAmount
        ) {
            revert TokenWizard__CannotChangeBorrowAmount(
                twContract.financialTerms.borrowAmount,
                financialTerms.borrowAmount
            );
        }
        revisedFinancialTerms = FinancialTerms(
            financialTerms.borrowAmount,
            financialTerms.interestRate,
            financialTerms.interestCompoundingInterval,
            financialTerms.dueDate,
            financialTerms.lateFeePercent,
            financialTerms.lateFeeCompoundingInterval,
            financialTerms.paymentAmounts,
            financialTerms.paymentDates
        );
        proposer = msg.sender;
        lastProposalTimestamp = uint32(block.timestamp);
        emit RevisedFinancialTermsProposed(msg.sender, financialTerms);
    }

    function approveRevisedFinancialTerms() public onlyInvolvedParties {
        if (revisedFinancialTerms.borrowAmount == 0) {
            revert TokenWizard__NoFinancialRevisionPending();
        }
        if (msg.sender == proposer) {
            revert TokenWizard__ProposerCannotApprove(msg.sender);
        }
        FinancialTerms memory oldTerms = twContract.financialTerms;
        twContract.financialTerms = revisedFinancialTerms;
        ///@dev resetting the revisedFinancialTerms variable
        delete revisedFinancialTerms;
        //revisedFinancialTerms.borrowAmount = 0;
        emit ContractFinancialTermsRevised(oldTerms, twContract.financialTerms);
    }

    /** view/pure functions */

    /**@dev returns uint32 amountOwed from twContract struct */
    function viewAmountStillOwed() public view returns (uint32) {
        return twContract.amountOwed;
    }

    /**@dev returns twContract Contract struct */
    function viewContractInfo() public view returns (Contract memory) {
        return twContract;
    }

    /**@dev returns the bools: borrowerApproved and lenderApproved */
    function viewApprovalStatus() public view returns (bool, bool) {
        return (borrowerApproved, lenderApproved);
    }

    /**@dev returns the proposed financial revisions currently */
    function viewProposedRevisalTerms() public view returns(FinancialTerms memory) {
        return revisedFinancialTerms;
    }

    /**@dev returns the address that most recently has called proposedFinancialTermRevision() */
    function viewProposerAddress() public view returns(address) {
        return proposer;
    }

    /**@dev returns uint32 lastProposalTimestamp which is used with oncePerHour modifier */
    function viewLastProposalTimestamp() public view returns(uint32) {
        return lastProposalTimestamp;
    }
}
