const { network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const args = []

    const tokenWizardFactory = await deploy("TokenWizardAutoFactory", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(tokenWizardFactory.address, args)
    }
}

module.exports.tags = ["all", "main", "factory"]
