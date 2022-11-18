const developmentChains = ["hardhat", "localhost"]

const networkConfig = {
    31337: {
        name: "localhost",
        name: "goerli",
        /**@notice these args are only for testing purposes */
        uri: "https://ipfs.io/ipfs/bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
        borrower: "0xe4A98D2bFD66Ce08128FdFFFC9070662E489a28E",
        lender: "0xac3d5989F52890fd15D5f3108601884E649D7b2b",
        financialTerms: [
            100000000,
            2500000000,
            100,
            2145916800,
            5000000000,
            100,
            [0],
            [0],
        ],
        priceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    5: {
        name: "goerli",
        /**@notice these args are only for testing purposes */
        uri: "ipfs://Qmd1VgfaZAMbBxRbXTYPbbjVmutrAhYPPEnrKpArsLgP4W", 
        borrower: "0xe4A98D2bFD66Ce08128FdFFFC9070662E489a28E",
        lender: "0xac3d5989F52890fd15D5f3108601884E649D7b2b",
        financialTerms: [
            1000000000,
            2500000000,
            86400,
            1669351951,
            0,
            0,
            [0],
            [0],
        ],
        priceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
}

const abi = [
    {
        inputs: [
            {
                internalType: "string",
                name: "_objectUri",
                type: "string",
            },
            {
                internalType: "address payable",
                name: "borrower",
                type: "address",
            },
            {
                internalType: "address payable",
                name: "lender",
                type: "address",
            },
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "borrowAmount",
                        type: "uint256",
                    },
                    {
                        internalType: "uint40",
                        name: "interestRate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "interestCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "dueDate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeePercent",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeeCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40[]",
                        name: "paymentDates",
                        type: "uint40[]",
                    },
                    {
                        internalType: "uint256[]",
                        name: "paymentAmounts",
                        type: "uint256[]",
                    },
                ],
                internalType: "struct TokenWizardAuto.FinancialTerms",
                name: "financialTerms",
                type: "tuple",
            },
            {
                internalType: "address",
                name: "_priceFeed",
                type: "address",
            },
        ],
        stateMutability: "payable",
        type: "constructor",
    },
    {
        inputs: [],
        name: "TokenWizard__AlreadyApprovedContract",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenWizard__BorrowAmountTransferFailed",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "borrower",
                type: "address",
            },
            { internalType: "address", name: "lender", type: "address" },
        ],
        name: "TokenWizard__BorrowerCantBeLender",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenWizard__BorrowerMustApproveFirst",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "borrowAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "revisedBorrowAmount",
                type: "uint256",
            },
        ],
        name: "TokenWizard__CannotChangeBorrowAmount",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenWizard__ContractMustBeApproved",
        type: "error",
    },
    {
        inputs: [{ internalType: "address", name: "caller", type: "address" }],
        name: "TokenWizard__InvalidCallerAddress",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint40",
                name: "interestRate",
                type: "uint40",
            },
            {
                internalType: "uint40",
                name: "interestCompoundingInterval",
                type: "uint40",
            },
        ],
        name: "TokenWizard__InvalidInterestParameters",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint40",
                name: "lateFeePercent",
                type: "uint40",
            },
            {
                internalType: "uint40",
                name: "lateFeeCompoundingInterval",
                type: "uint40",
            },
        ],
        name: "TokenWizard__InvalidLateFeeParameters",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenWizard__LenderMustSendBorrowAmount",
        type: "error",
    },
    {
        inputs: [],
        name: "TokenWizard__NoFinancialRevisionPending",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint16",
                name: "secondsRemaining",
                type: "uint16",
            },
        ],
        name: "TokenWizard__OncePerHour",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint16",
                name: "paymentAmountsArrayLength",
                type: "uint16",
            },
            {
                internalType: "uint16",
                name: "paymentDatesArrayLength",
                type: "uint16",
            },
        ],
        name: "TokenWizard__PaymentArrayLengthsNotEqual",
        type: "error",
    },
    {
        inputs: [
            { internalType: "address", name: "proposer", type: "address" },
        ],
        name: "TokenWizard__ProposerCannotApprove",
        type: "error",
    },
    { inputs: [], name: "TokenWizard__WithdrawalFailed", type: "error" },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "lender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "borrowAmount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "borrower",
                type: "address",
            },
        ],
        name: "BorrowAmountTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "totalAmountPaid",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint40",
                name: "timeTaken",
                type: "uint40",
            },
        ],
        name: "ContractCompleted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint256",
                name: "borrowAmount",
                type: "uint256",
            },
            {
                indexed: true,
                internalType: "address",
                name: "borrower",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "lender",
                type: "address",
            },
        ],
        name: "ContractDrafted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "initialAmountOwed",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountOwed",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "timesInterestCompounded",
                type: "uint256",
            },
        ],
        name: "InterestAdded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "initialAmountOwed",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountOwed",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "timesLateFeeCompounded",
                type: "uint256",
            },
        ],
        name: "LateFeeCharged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "amountPaid",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amountStillOwed",
                type: "uint256",
            },
        ],
        name: "PaymentMade",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "withdrawer",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "WithdrawalSuccessful",
        type: "event",
    },
    {
        inputs: [],
        name: "approveContract",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [],
        name: "approveRevisedFinancialTerms",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes", name: "", type: "bytes" }],
        name: "checkUpkeep",
        outputs: [
            { internalType: "bool", name: "upkeepNeeded", type: "bool" },
            { internalType: "bytes", name: "", type: "bytes" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "makePayment",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes", name: "", type: "bytes" }],
        name: "performUpkeep",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint40",
                name: "amountOwed",
                type: "uint40",
            },
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "borrowAmount",
                        type: "uint256",
                    },
                    {
                        internalType: "uint40",
                        name: "interestRate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "interestCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "dueDate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeePercent",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeeCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40[]",
                        name: "paymentDates",
                        type: "uint40[]",
                    },
                    {
                        internalType: "uint256[]",
                        name: "paymentAmounts",
                        type: "uint256[]",
                    },
                ],
                internalType: "struct TokenWizardAuto.FinancialTerms",
                name: "financialTerms",
                type: "tuple",
            },
        ],
        name: "proposeFinancialTermsRevision",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "revisedAmountOwed",
        outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "revisedFinancialTerms",
        outputs: [
            {
                internalType: "uint256",
                name: "borrowAmount",
                type: "uint256",
            },
            {
                internalType: "uint40",
                name: "interestRate",
                type: "uint40",
            },
            {
                internalType: "uint40",
                name: "interestCompoundingInterval",
                type: "uint40",
            },
            { internalType: "uint40", name: "dueDate", type: "uint40" },
            {
                internalType: "uint40",
                name: "lateFeePercent",
                type: "uint40",
            },
            {
                internalType: "uint40",
                name: "lateFeeCompoundingInterval",
                type: "uint40",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "twContract",
        outputs: [
            { internalType: "string", name: "objectURI", type: "string" },
            {
                internalType: "address payable",
                name: "borrower",
                type: "address",
            },
            {
                internalType: "address payable",
                name: "lender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amountOwed",
                type: "uint256",
            },
            {
                components: [
                    {
                        internalType: "uint256",
                        name: "borrowAmount",
                        type: "uint256",
                    },
                    {
                        internalType: "uint40",
                        name: "interestRate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "interestCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "dueDate",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeePercent",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40",
                        name: "lateFeeCompoundingInterval",
                        type: "uint40",
                    },
                    {
                        internalType: "uint40[]",
                        name: "paymentDates",
                        type: "uint40[]",
                    },
                    {
                        internalType: "uint256[]",
                        name: "paymentAmounts",
                        type: "uint256[]",
                    },
                ],
                internalType: "struct TokenWizardAuto.FinancialTerms",
                name: "financialTerms",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewAmountStillOwed",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewApprovalStatus",
        outputs: [
            { internalType: "bool", name: "", type: "bool" },
            { internalType: "bool", name: "", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewContractBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewLastProposalTimestamp",
        outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewProposerAddress",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewTimestamp",
        outputs: [{ internalType: "uint40", name: "", type: "uint40" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "viewTotalAmountPaid",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    { stateMutability: "payable", type: "receive" },
]

module.exports = {
    developmentChains,
    networkConfig,
    abi,
}
