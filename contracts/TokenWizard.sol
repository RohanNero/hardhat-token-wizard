//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./PriceConverter.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

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
    uint256 borrowAmount,
    uint256 revisedBorrowAmount
);
error TokenWizard__OncePerHour(uint16 secondsRemaining);
error TokenWizard__NoFinancialRevisionPending();
error TokenWizard__BorrowAmountTransferFailed();
error TokenWizard__AlreadyTransferredBorrowAmount();
error TokenWizard__LenderMustSendBorrowAmount();
error TokenWizard__AlreadyWithdrawnBorrowAmount();
error TokenWizard__WithdrawalFailed();
error TokenWizard__ContractMustBeApproved();
error TokenWizard__BorrowerMustApproveFirst();

/**@title platform for creating financialContracts using physical objects as collateral
   @author Rohan Nero
   @notice I think by having the liquidity sent to this contract and then to the other address could be 
   tweaked in the future for gas reaons. The contract currently acts as a 'middleman' that takes no money */
contract TokenWizard {
    /** type declarations and state variables */

    using PriceConverter for uint256;

    /**@dev this address is saved and updated whenever a user proposes revisions to the contract */
    address private proposer;

    /**@dev this bool is here so that the borrower can only withdraw the borrowAmount once */
    bool private borrowerAmountWithdrawn;

    /**@dev these two bools represent if the borrower/lender has approved the contract */
    bool private borrowerApproved;
    bool private lenderApproved;

    /**@dev this timestamp gets initialized once the contract is approved by both parties */
    uint32 private startingTimestamp;

    /**@dev total amount paid by the borrower over the course of the contract's life */
    uint256 private totalPaid;

    /**@dev this represents the amount paid toward the next minimum payment (if contract terms has any) */
    uint256 private totalPaidThisTerm;

    /**@dev use to limit the amount of time a user must wait between proposing changes to the contract terms */
    uint32 private lastProposalTimestamp;

    /**@dev used to track amount of times a user missed a payment due date */
    uint24 private numOfLatePayments;

    Contract private twContract;
    FinancialTerms private revisedFinancialTerms;

    AggregatorV3Interface private priceFeed;

    struct FinancialTerms {
        uint256 borrowAmount; ///@dev amount of liquidity being borrowed in chosen currency (followed by 8 decimal places)
        uint8 interestRate; ///@dev interest rate on the borrowed liquidity
        uint32 interestCompoundingInterval; ///@dev interest compounding time interval in seconds
        uint32 dueDate; ///@dev unix timestamp
        uint8 lateFeePercent; ///@dev percentage used to caluclate how much is charged if payment is late
        uint32 lateFeeCompoundingInterval; ///@dev late fee compounding time interval in seconds
        uint32[] paymentDates; ///@dev array of unix timestamps representing when payments will be due
        uint256[] paymentAmounts; ///@dev array of amounts corresponding to payment dates
    }

    struct Contract {
        string objectURI; ///@dev similar to NFT URI, this points to JSON containing a name, description, and an imageURI
        address payable borrower; ///@dev user who is listing their physical item as collateral to borrow liquidity from a lender
        address payable lender; ///@dev user who is lending liquidity to the borrower
        uint256 amountOwed; ///@dev uint representing amount borrower still owes to the lender in chosen currency (8 decimal places)
        FinancialTerms financialTerms; ///@dev FinancialTerms struct containing atleast 8 uints detailing terms of contract
    }

    /** events and modifiers */

    event ContractDrafted(
        uint256 indexed borrowAmount,
        address indexed borrower,
        address indexed lender
    );
    // event ContractApproved(address approver);
    event RevisedFinancialTermsProposed(
        address proposer,
        FinancialTerms newFinancialTerms
    );
    event ContractFinancialTermsRevised(
        FinancialTerms oldTerms,
        FinancialTerms newTerms
    );
    event BorrowAmountTransferred(
        address lender,
        uint256 borrowAmount,
        address borrower
    );
    event PaymentMade(uint256 amountPaid, uint256 amountStillOwed);
    /**@notice timeTaken is the time in seconds: since the contract was approved until it was completely paid off */
    event ContractCompleted(uint256 totalAmountPaid, uint32 timeTaken);
    event WithdrawalSuccessful(address indexed withdrawer, uint256 amount);

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

    modifier mustBeApproved() {
        if (borrowerApproved == false || lenderApproved == false) {
            revert TokenWizard__ContractMustBeApproved();
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
        address payable borrower,
        address payable lender,
        FinancialTerms memory financialTerms,
        address _priceFeed
    ) payable {
        if (borrower == lender) {
            revert TokenWizard__BorrowerCantBeLender(borrower, lender);
        }
        if (
            financialTerms.paymentAmounts.length !=
            financialTerms.paymentDates.length
        ) {
            revert TokenWizard__PaymentArrayLengthsNotEqual(
                uint16(financialTerms.paymentDates.length),
                uint16(financialTerms.paymentAmounts.length)
            );
        }
        twContract = Contract(
            _objectUri,
            borrower,
            lender,
            financialTerms.borrowAmount,
            financialTerms
        );
        priceFeed = AggregatorV3Interface(_priceFeed);
        if (msg.sender == borrower) {
            borrowerApproved = true;
        } /** else if (msg.sender == lender) {
             This was causing test to fail with massive error code, guessing its caused by function call to external contract
            /*  @dev if lender deployed contract and passed borrowAmount to contract then sets lenderApproved = true 
            // if (msg.value.getConversionRate(priceFeed) >= (twContract.financialTerms.borrowAmount * 1e10)) {
            //     lenderApproved = true;
            // } 
        } */
        emit ContractDrafted(
            twContract.amountOwed,
            twContract.borrower,
            twContract.lender
        );
    }

    /** @notice lender can send funds directly to the contract to approve it, and borrower can too instead of using makePayment() function */
    receive() external payable {
        if (msg.sender == twContract.lender) {
            if (lenderApproved == true) {
                revert TokenWizard__AlreadyApprovedContract();
            } else if (
                msg.value.getEthConversionRate(priceFeed) >=
                twContract.financialTerms.borrowAmount * 1e10 ||
                address(this).balance.getEthConversionRate(priceFeed) >=
                twContract.financialTerms.borrowAmount * 1e10
            ) {
                if (borrowerApproved == true) {
                    (bool sent, ) = twContract.borrower.call{
                        value: twContract
                            .financialTerms
                            .borrowAmount
                            .getXConversionRate(priceFeed)
                    }("");
                    if (sent) {
                        lenderApproved = true;
                    } else {
                        revert TokenWizard__BorrowAmountTransferFailed();
                    }
                }
            }
        } else if (
            msg.sender == twContract.borrower && lenderApproved == true
        ) {
            uint256 amountPaid = msg.value.getEthConversionRate(priceFeed) /
                1e10;
            totalPaid += amountPaid;
            totalPaidThisTerm += amountPaid;
            if (int256(twContract.amountOwed - amountPaid) > 0) {
                twContract.amountOwed -= amountPaid;
                emit PaymentMade(amountPaid, twContract.amountOwed);
            } else if (int256(twContract.amountOwed - amountPaid) <= 0) {
                twContract.amountOwed = 0;
                emit ContractCompleted(
                    totalPaid,
                    uint32(block.timestamp - startingTimestamp)
                );
            }
        }
    }

    /** @notice proof that both parties agree to contract terms on-chain && borrowAmount transferred to contract/borrower
      @dev setting borrowerApproved/lenderApproved bool to true */
    function approveContract() public payable onlyInvolvedParties {
        if (lenderApproved == true) {
            revert TokenWizard__AlreadyApprovedContract();
        } else if (msg.sender == twContract.borrower) {
            if (borrowerApproved == false) {
                borrowerApproved = true;
                if (
                    address(this).balance.getEthConversionRate(priceFeed) >=
                    twContract.financialTerms.borrowAmount * 1e10
                ) {
                    (bool sent, ) = twContract.borrower.call{
                        value: twContract
                            .financialTerms
                            .borrowAmount
                            .getXConversionRate(priceFeed)
                    }("");
                    if (sent) {
                        lenderApproved = true;
                        startingTimestamp = uint32(block.timestamp);
                        emit BorrowAmountTransferred(
                            twContract.lender,
                            twContract.amountOwed,
                            twContract.borrower
                        );
                    } else {
                        revert TokenWizard__BorrowAmountTransferFailed();
                    }
                }
            } else if (borrowerApproved == true) {
                revert TokenWizard__AlreadyApprovedContract();
            }
        } else if (msg.sender == twContract.lender) {
            if (borrowerApproved == true) {
                if (
                    (msg.value.getEthConversionRate(priceFeed) >=
                        (twContract.financialTerms.borrowAmount * 1e10)) ||
                    (address(this).balance.getEthConversionRate(priceFeed) >=
                        twContract.financialTerms.borrowAmount * 1e10)
                ) {
                    (bool sent, ) = twContract.borrower.call{
                        value: twContract.amountOwed.getXConversionRate(
                            priceFeed
                        )
                    }("");
                    if (sent) {
                        lenderApproved = true;
                        startingTimestamp = uint32(block.timestamp);
                        emit BorrowAmountTransferred(
                            twContract.lender,
                            twContract.amountOwed,
                            twContract.borrower
                        );
                    } else {
                        revert TokenWizard__BorrowAmountTransferFailed();
                    }
                } else {
                    revert TokenWizard__LenderMustSendBorrowAmount();
                }
            } else if (borrowerApproved == false) {
                revert TokenWizard__BorrowerMustApproveFirst();
            }
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
            financialTerms.paymentDates,
            financialTerms.paymentAmounts
        );
        proposer = msg.sender;
        lastProposalTimestamp = uint32(block.timestamp);
        emit RevisedFinancialTermsProposed(msg.sender, financialTerms);
    }

    /** @notice this function allows users to approve revised contract terms */
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

    /** @dev borrower can use this function to repay the lender */
    function makePayment() public payable mustBeApproved {
        if (msg.sender != twContract.borrower) {
            revert TokenWizard__InvalidCallerAddress(
                twContract.borrower,
                twContract.lender,
                msg.sender
            );
        }
        uint256 amountPaid = msg.value.getEthConversionRate(priceFeed) / 1e10;
        totalPaid += amountPaid;
        totalPaidThisTerm += amountPaid;
        if (int256(twContract.amountOwed - amountPaid) > 0) {
            twContract.amountOwed -= amountPaid;
            emit PaymentMade(amountPaid, twContract.amountOwed);
        } else if (int256(twContract.amountOwed - amountPaid) <= 0) {
            twContract.amountOwed = 0;
            emit ContractCompleted(
                totalPaid,
                uint32(block.timestamp - startingTimestamp)
            );
        }
    }

    /** @notice lender uses this to withdraw ETH the borrower has sent 
        @dev does borrower ever actually need to call this function? */
    function withdraw() public onlyInvolvedParties mustBeApproved {
        /*if (msg.sender == twContract.borrower) {
            if (borrowerApproved && lenderApproved) {
                if (borrowerAmountWithdrawn == false) {
                    (bool sent, ) = twContract.borrower.call{
                        value: uint256(twContract.financialTerms.borrowAmount)
                    }("");
                    if (sent) {
                        emit WithdrawalSuccessful(
                            msg.sender,
                            twContract.financialTerms.borrowAmount
                        );
                    } else {
                        revert TokenWizard__WithdrawalFailed();
                    }
                } else {
                    revert TokenWizard__AlreadyWithdrawnBorrowAmount();
                }
            } else {
                revert TokenWizard__ContractMustBeApproved();
            }
        } */
        if (msg.sender == twContract.lender) {
            uint256 balBeforeWithdraw = address(this)
                .balance
                .getEthConversionRate(priceFeed) / 1e10; // to emit amount withdrawn in X currency
            (bool sent, ) = twContract.lender.call{
                value: address(this).balance
            }("");
            if (sent) {
                emit WithdrawalSuccessful(msg.sender, balBeforeWithdraw);
            } else {
                revert TokenWizard__WithdrawalFailed();
            }
        } else {
            revert TokenWizard__InvalidCallerAddress(
                twContract.borrower,
                twContract.lender,
                msg.sender
            );
        }
    }

    /** view/pure functions */

    /* commented this function out to practice using embedded Library instead (all internal library functions)
    // this function uses the given priceFeed to convert an ethAmount(wei) into it the chosen currency 
    function viewEthConversionPrice(uint256 ethAmount)
         public
         view
         returns (uint256)
     {
         (, int256 rawPriceData, , , ) = priceFeed.latestRoundData();
         uint256 priceData = uint256(rawPriceData * 1e10);
         uint256 price = (priceData * ethAmount) / 1e18;
         return price;
     }   
    */

    /** @dev returns uint32 amountOwed from twContract struct */
    function viewAmountStillOwed() public view returns (uint256) {
        return twContract.amountOwed;
    }

    /** @dev returns twContract Contract struct */
    function viewContractInfo() public view returns (Contract memory) {
        return twContract;
    }

    /** @dev returns the bools: borrowerApproved and lenderApproved */
    function viewApprovalStatus() public view returns (bool, bool) {
        return (borrowerApproved, lenderApproved);
    }

    /** @dev returns the proposed financial revisions currently */
    function viewProposedRevisalTerms()
        public
        view
        returns (FinancialTerms memory)
    {
        return revisedFinancialTerms;
    }

    /**@dev returns the address that most recently has called proposedFinancialTermRevision() */
    function viewProposerAddress() public view returns (address) {
        return proposer;
    }

    /**@dev returns uint32 lastProposalTimestamp which is used with oncePerHour modifier */
    function viewLastProposalTimestamp() public view returns (uint32) {
        return lastProposalTimestamp;
    }

    /**@dev returns current eth balance of this contract */
    function viewContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**@dev returns uints totalPaid and totalPaidThisTerm */
    function viewTotalAmountPaid() public view returns (uint256, uint256) {
        return (totalPaid, totalPaidThisTerm);
    }
}
