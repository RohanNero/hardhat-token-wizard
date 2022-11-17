const { network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer, lender } = await getNamedAccounts()
    const chainId = network.config.chainId
    let args
    if (developmentChains.includes(network.name)) {
        mockAggregator = await ethers.getContract("MockV3Aggregator")
        // console.log("mockAddr:",mockAggregator.address)
        // console.log("deployer:",deployer)
        // console.log("user:",user)
        args = [
            "uri",
            deployer,
            lender,
            networkConfig[5]["financialTerms"],
            mockAggregator.address,
        ]
    } else {
        args = [
            networkConfig[chainId]["uri"],
            networkConfig[chainId]["borrower"],
            networkConfig[chainId]["lender"],
            networkConfig[chainId]["financialTerms"],
            networkConfig[chainId]["priceFeed"],
        ]
    }
    //console.log("args:",args)

    const tokenWizard = await deploy("TokenWizardAuto", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(tokenWizard.address, args)
    }
}

module.exports.tags = ["all", "main", "auto"]
