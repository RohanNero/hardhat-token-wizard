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
        enabled: false,
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
