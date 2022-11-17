const { network, getNamedAccounts, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config.js")

async function main() {
    const { deployer, lender } = await getNamedAccounts()
    const chainId = network.config.chainId
    tokenFactory = await ethers.getContract("TokenWizardAutoFactory", deployer)
    console.log(
        "-------------------------------------------------------------------------------"
    )
    console.log("Contract grabbed!")
    console.log("Preparing to call createTokenWizardAutoContract()...")
    let tx
    if (developmentChains.includes(network.name)) {
        console.log("Development chain detected...")
        mockAggregator = await ethers.getContract("MockV3Aggregator")
        // console.log("mockAddr:",mockAggregator.address)
        // console.log("deployer:",deployer)
        // console.log("user:",user)
        tx = await tokenFactory.createTokenWizardAutoContract(
            "uri",
            deployer,
            lender,
            networkConfig[5]["financialTerms"],
            mockAggregator.address
        )
    } else {
        tx = await tokenFactory.createTokenWizardAutoContract(
            networkConfig[chainId]["uri"],
            networkConfig[chainId]["borrower"],
            networkConfig[chainId]["lender"],
            networkConfig[chainId]["financialTerms"],
            networkConfig[chainId]["priceFeed"]
        )
    }

    const txReceipt = await tx.wait()
    console.log("Function called successfully!")
    console.log(
        "-------------------------------------------------------------------------------"
    )
    console.log(
        "Your new TokenWizardAuto address:",
        txReceipt.events[1].args.contractAddress
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
