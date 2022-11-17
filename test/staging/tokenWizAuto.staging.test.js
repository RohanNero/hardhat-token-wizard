// const { network } = require("hardhat")
// const {
//     developmentChains,
//     networkConfig,
// } = require("../../helper-hardhat-config.js")
// const { assert, expect } = require("chai")


/// Cant finish testing because I ran out of Goerli ETH and ran into some errors I cant figure out:
/// 1. Error: insufficient funds for intrinsic transaction cost
/// 2. Error: Contract with a Signer cannot override from (operation="overrides.from", code=UNSUPPORTED_OPERATION, version=contracts/5.7.0)

// developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("TokenWizardAutoFactory staging test", function () {
//           let tokenFactory
//           const chainId = network.config.chainId
//           const testArgs = [
//               networkConfig[chainId]["uri"],
//               networkConfig[chainId]["borrower"],
//               networkConfig[chainId]["lender"],
//               networkConfig[chainId]["financialTerms"],
//               networkConfig[chainId]["priceFeed"],
//           ]
//           beforeEach(async function () {
//               const { deployer, lender } = await getNamedAccounts()
//               //tokenFactory = await ethers.getContract("TokenWizardAutoFactory")
//               tokenWizard = await ethers.getContract("TokenWizardAuto")
//               await tokenWizard
//                   .approveContract({ from: lender, value: "100000000000000" })
//           })
//           /**@dev will create two versions and just comment out other version to test second one:
//            * 1. tests interest being charged and user paying off contract
//            * 2. tests late fee being charged and user paying off contract
//            */
//           it("allows anyone to pay off a contract that charges interest/late fees", async function () {
//               await expect(
//                   tokenWizard.makePayment({ value: "100000000000000" })
//               ).to.emit(tokenWizard, "ContractCompleted")
//           })
//       })
