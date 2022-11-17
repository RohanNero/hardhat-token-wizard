require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-deploy")
require("hardhat-contract-sizer")
require("dotenv").config()
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")
require("chai")

GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
PRIVATE_KEY = process.env.PRIVATE_KEY
LENDER_PRIVATE_KEY = process.env.LENDER_PRIVATE_KEY
USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/**@dev outdated and replaced with newer version with same name 'viewContractInfo' */
// task(
//     "viewContractInfo",
//     "returns twContract struct from most recent TokenWizardAuto contract"
// )
//     .addOptionalParam(
//         "stringify",
//         "input anything to return info in string format"
//     )
//     //.addParam("address", "The contract's address")
//     .setAction(async ({ stringify }) => {
//         //const {abi} = require("./helper-hardhat-config.js")
//         //console.log(abi)
//         const tokenWizardAuto = await ethers.getContract("TokenWizardAuto")
//         //console.log(tokenWizardAuto)
//         const info = await tokenWizardAuto.twContract()
//         if (stringify) {
//             console.log("objectURI:", info[0].toString())
//             console.log("borrower:", info[1].toString())
//             console.log("lender:", info[2].toString())
//             console.log("amountOwed:", info[3].toString())
//             console.log("borrowAmount:", info[4][0].toString())
//             console.log("interestRate:", info[4][1].toString())
//             console.log("interestCompoundingInterval:", info[4][2].toString())
//             console.log("dueDate:", info[4][3].toString())
//             console.log("lateFeePercent:", info[4][4].toString())
//             console.log("lateFeeCompoundingInterval:", info[4][5].toString())
//             console.log("paymentDates:", info[4][6].toString())
//             console.log("paymentAmounts:", info[4][7].toString())
//         } else {
//             console.log(info)
//         }
// })

/**@dev viewContractInfo returns twContract struct for inputted TokenWizardAuto contract */
task(
    "viewContractInfo",
    "returns twContract struct from most recent TokenWizardAuto contract"
)
    .addParam("address", "The contract's address")
    .addOptionalParam(
        "stringify",
        "input anything to return info in string format"
    )
    .setAction(async ({ address, stringify }) => {
        const { abi } = require("./helper-hardhat-config.js")
        //console.log(abi)
        const tokenWizardAuto = await ethers.getContractAt(abi, address)
        //console.log(tokenWizardAuto)
        const info = await tokenWizardAuto.twContract()
        //console.log(info)
        if (stringify) {
            console.log("objectURI:", info[0].toString())
            console.log("borrower:", info[1].toString())
            console.log("lender:", info[2].toString())
            console.log("amountOwed:", info[3].toString())
            console.log("borrowAmount:", info[4][0].toString())
            console.log("interestRate:", info[4][1].toString())
            console.log("interestCompoundingInterval:", info[4][2].toString())
            console.log("dueDate:", info[4][3].toString())
            console.log("lateFeePercent:", info[4][4].toString())
            console.log("lateFeeCompoundingInterval:", info[4][5].toString())
            console.log("paymentDates:", info[4][6].toString())
            console.log("paymentAmounts:", info[4][7].toString())
        } else {
            console.log(info)
        }
    })

/**@dev this task views the approvalStatus of the most recent TWA contract */
task(
    "viewApprovalStatus",
    "calls viewApprovalStatus on most recent TokenWizardAuto contract"
)
    .addParam("address", "TokenWizardAuto contract address you wish to view")
    .setAction(async ({ address }) => {
        const { abi } = require("./helper-hardhat-config.js")
        const tokenWizardAuto = await ethers.getContractAt(abi, address)
        const [borrowerApproved, lenderApproved] =
            await tokenWizardAuto.viewApprovalStatus()
        console.log("borrowerApproved:", borrowerApproved)
        console.log("lenderApproved:", lenderApproved)
    })

/**@dev this task approves the recent TWA contract for both borrower and lender */
task(
    "borrowerApprove",
    "calls approveContract on most recent TokenWizardAuto contract for borrower"
)
    .addParam("address", "TokenWizardAuto contract address you wish to view")
    //.addParam("name", "your account name from the namedAccount config")
    //.addOptionalParam("value", "ether value in WEI")
    .setAction(async ({ address }) => {
        console.log("grabbing and connecting namedAccount to contract...")
        const { abi } = require("./helper-hardhat-config.js")
        const { deployer } = await getNamedAccounts()
        //console.log(deployer)
        const tokenWizardAuto = await ethers.getContractAt(
            abi,
            address,
            deployer
        )
        console.log("Success!")
        //console.log("approving for borrower...")
        //await tokenWizardAuto.approveContract()
        // console.log("Success!")
        //console.log(tokenWizardAuto)
        if (1 == 1) {
            console.log("approving for borrower...")
            await tokenWizardAuto.approveContract()
            console.log("Success!")
        } //else {
        //     await tokenWizardAuto.connect(namedAccount).approveContract({ value })
        //     console.log("contract approved as lender!")
        // }
    })

/**@dev this task approves the recent TWA contract for both borrower and lender */
task(
    "lenderApprove",
    "calls approveContract on most recent TokenWizardAuto contract for lender"
).addParam("address", "TokenWizardAuto contract address you wish to view")
    //.addParam("name", "your account name from the namedAccount config")
    //.addOptionalParam("value", "ether value in WEI")
    .setAction(async ({address}) => {
        const { abi } = require("./helper-hardhat-config.js")
        console.log("grabbing and connecting namedAccount to contract...")
        const { lender } = await getNamedAccounts()
        //console.log(lender)
        const tokenWizardAuto = await ethers.getContractAt(
            abi,address,
            lender
        )
        console.log("Success!")
        //console.log("approving for borrower...")
        //await tokenWizardAuto.approveContract()
        // console.log("Success!")
        //console.log(tokenWizardAuto)
        if (1 == 1) {
            console.log("approving for lender...")
            await tokenWizardAuto.approveContract({
                value: "1000000000000000000",
            })
            console.log("Success!")
        } //else {
        //     await tokenWizardAuto.connect(namedAccount).approveContract({ value })
        //     console.log("contract approved as lender!")
        // }
    })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },

    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        goerli: {
            url: GOERLI_RPC_URL || "",
            accounts:
                [PRIVATE_KEY, LENDER_PRIVATE_KEY, USER_PRIVATE_KEY] || "key",
            chainId: 5,
            blockConfirmations: 5,
        },
    },
    namedAccounts: {
        deployer: 0,
        lender: 1,
        user: 2,
    },
    gasReporter: {
        enabled: true,
        //outputFile: "gas-report.txt",
        //noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        currency: "USD",
        token: "ETH",
        //gasPrice: 21,
    },
    mocha: {
        timeout: 400000,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
}
