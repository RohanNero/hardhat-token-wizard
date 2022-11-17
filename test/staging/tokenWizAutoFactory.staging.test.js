const { network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config.js")
const {assert, expect} = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("TokenWizardAutoFactory staging test", function () {
          let tokenFactory
          const chainId = network.config.chainId
          const testArgs = [
              networkConfig[chainId]["uri"],
              networkConfig[chainId]["borrower"],
              networkConfig[chainId]["lender"],
              networkConfig[chainId]["financialTerms"],
              networkConfig[chainId]["priceFeed"],
          ]
          beforeEach(async function () {
              tokenFactory = await ethers.getContract("TokenWizardAutoFactory")
          })
          it("allows anyone to deploy a TokenWizardAuto contract", async function () {
              await expect(
                  tokenFactory.createTokenWizardAutoContract(networkConfig[chainId]["uri"],
                  networkConfig[chainId]["borrower"],
                  networkConfig[chainId]["lender"],
                  networkConfig[chainId]["financialTerms"],
                  networkConfig[chainId]["priceFeed"],)
              ).to.emit(tokenFactory, "ContractCreated")
          })
      })
