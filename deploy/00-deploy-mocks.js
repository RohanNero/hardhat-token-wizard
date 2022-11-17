const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")


module.exports = async function({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer, lender, user} = await getNamedAccounts()
    const DECIMALS = 8 // number of decimals
          const INITIAL_ANSWER = 5000000000 // mock price of eth = $50
    const args = [DECIMALS, INITIAL_ANSWER]

    if(developmentChains.includes(network.name)) {
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: args,
            log: true,
            waitConfirmations: 1
        })
    }
    
}

module.exports.tags = ["all", "mocks"]
