// const {
//     developmentChains,
//     networkConfig,
// } = require("../../helper-hardhat-config")
// const { ethers, network } = require("hardhat")
// const { assert, expect } = require("chai")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("tokenWizard unit tests", function () {
//           const testArgs = Array("objectURI", "0x1", "0x2", [
//               1,
//               2,
//               3,
//               4,
//               5,
//               [6],
//               7,
//               8,
//           ])
//           let tokenWizard, deployer, user1, user2
//           beforeEach(async function () {
//               ;[deployer, user1, user2] = await ethers.getSigners()
//               const factory = await ethers.getContractFactory(
//                   "TokenWizard",
//                   deployer
//               )
//               tokenWizard = await factory.deploy()
//               //   ;(testArgs = "objectURI"),
//               //       deployer.address,
//               //       user1.address,
//               //       [1, 2, 3, 4, 5, [6], 7, 8]
//           })
//           describe("constructor", function () {
//               it("", async function () {})
//           })
//           describe("createContract", function () {
//               it("reverts if borrower and lender are the same address", async function () {
//                   await expect(
//                       tokenWizard.createContract(
//                           "uri",
//                           deployer.address,
//                           deployer.address,
//                           [1, 2, 3, 4, 5, 6, [7], [8]]
//                       )
//                   )
//                       .to.be.revertedWithCustomError(
//                           tokenWizard,
//                           "TokenWizard__BorrowerCantBeLender"
//                       )
//                       .withArgs(deployer.address, deployer.address)
//               })
//               it("reverts if payment array lengths aren't equal", async function() {
//                 await expect(tokenWizard.createContract("uri", deployer.address, user1.address, [420,2,3,4,5,6,[7,77,777],[8]])).to.be.revertedWithCustomError(tokenWizard, "TokenWizard__FinancialArrayLengthsNotEqual").withArgs(3,1)
//               })
//             //   it("should add new contract struct to contractArray", async function () {
//             //       await tokenWizard.createContract(
//             //           "objectURI",
//             //           deployer.address,
//             //           user1.address,
//             //           [420, 2, 3, 4, 5, 6, [7], [8]]
//             //       )
//             //       const finalVal = await tokenWizard.pendingContractArray(0)
//             //       assert.equal(
//             //           finalVal.toString(),
//             //           [
//             //               "objectURI",
//             //               deployer.address,
//             //               user1.address,
//             //               0,
//             //               420,
//             //               [420, 2, 3, 4, 5, 6, [7], [8]],
                          
//             //           ].toString()
//             //       )
//             //   })
//               it("should update the idToApprovalStatus mapping if called by borrower/lender", async function () {
//                   const initVal = await tokenWizard.idToApprovalStatus(0)
//                   await tokenWizard.createContract(
//                       "objectURI",
//                       deployer.address,
//                       user1.address,
//                       [1, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   const finalVal = await tokenWizard.idToApprovalStatus(0)
//                   assert.equal(finalVal.toString(), [true, false].toString())
//               })
//               it("emits the ContractDrafted event correctly", async function () {
//                   await expect(
//                       tokenWizard.createContract(
//                           "objectURI",
//                           deployer.address,
//                           user1.address,
//                           [1, 2, 3, 4, 5, 6, [7], [8]]
//                       )
//                   )
//                       .to.emit(tokenWizard, "ContractDrafted")
//                       .withArgs(0, deployer.address, user1.address)
//               })
//               it("returns the drafted contract's pendingContractArrayIndex correctly", async function () {
//                   const value = await tokenWizard.createContract(
//                       "objectURI",
//                       deployer.address,
//                       user1.address,
//                       [1, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   const testValue = await tokenWizard.callStatic.createContract(
//                       "test",
//                       user1.address,
//                       deployer.address,
//                       [8, 7, 6, 5, 4, 3, [2], [1]]
//                   )
//                   assert.equal(testValue.toString(), "1")
//               })
//           })
//           describe("approvePendingContract", function () {
//               beforeEach(async function () {
//                   await tokenWizard.createContract(
//                       "uri",
//                       deployer.address,
//                       user1.address,
//                       [420, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard
//                       .connect(user1)
//                       .createContract("URI", deployer.address, user2.address, [
//                           777,
//                           2,
//                           3,
//                           4,
//                           5,
//                           6,
//                           [7],
//                           [8],
//                       ])
//               })
//               it("reverts if msg.sender isnt borrower or lender of that contract", async function () {
//                   await expect(
//                       tokenWizard.connect(user2).approvePendingContract(0)
//                   )
//                       .to.be.revertedWithCustomError(
//                           tokenWizard,
//                           "TokenWizard__UserIsntInvolved"
//                       )
//                       .withArgs(
//                           0,
//                           deployer.address,
//                           user1.address,
//                           user2.address
//                       )
//               })
//               it("reverts if contract is already approved by both parties", async function () {
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   await expect(tokenWizard.approvePendingContract(0))
//                       .to.be.revertedWithCustomError(
//                           tokenWizard,
//                           "TokenWizard__ContractAlreadyApproved"
//                       )
//                       .withArgs(0)
//               })
//               it("updates borrower approval status correctly if no one has approved yet", async function () {
//                   const initVal = await tokenWizard.idToApprovalStatus(1)
//                   await tokenWizard.approvePendingContract(1)
//                   const finalVal = await tokenWizard.idToApprovalStatus(1)
//                   assert.equal(finalVal.toString(), [true, false].toString())
//               })
//               it("updates lender approval status correctly if no one has approved yet", async function () {
//                   await tokenWizard.connect(user2).approvePendingContract(1)
//                   const finalVal = await tokenWizard.idToApprovalStatus(1)
//                   assert.equal(finalVal.toString(), [false, true].toString())
//               })
//               it("emits ContractApproved event correctly", async function () {
//                   await expect(tokenWizard.approvePendingContract(1))
//                       .to.emit(tokenWizard, "ContractApproved")
//                       .withArgs(1, deployer.address)
//               })
//               it("adds contract to ContractArray if borrower calls and lender already approved", async function () {
//                   await tokenWizard.connect(user2).approvePendingContract(1)
//                   await tokenWizard.approvePendingContract(1)
//                   const value = await tokenWizard.contractArray(0)
//                   assert.equal(
//                       value.toString(),
//                       [
//                           "URI",
//                           deployer.address,
//                           user2.address,
//                           "1",
//                           "777",
//                           "777",
//                           "2",
//                           "3",
//                           "4",
//                           "5",
//                           "6",
//                           "7",
//                           "8",
//                       ].toString()
//                   )
//               })
//               it("adds contract to ContractArray if lender calls and borrower already approved", async function () {
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const value = await tokenWizard.contractArray(0)
//                   assert.equal(
//                       value.toString(),
//                       [
//                           "uri",
//                           deployer.address,
//                           user1.address,
//                           "0",
//                           "420",
//                           "420",
//                           "2",
//                           "3",
//                           "4",
//                           "5",
//                           "6",
//                           "7",
//                           "8", 
//                       ].toString()
//                   )
//               })
//           })
//           describe("getContractArrayLength", function () {
//               it("returns length of array correctly", async function () {
//                   const args = ["object", deployer.address, user1.address, 7]
//                   const initVal = await tokenWizard.getContractArrayLength()
//                   await tokenWizard.createContract(
//                       "objectURI",
//                       deployer.address,
//                       user1.address,
//                       [1, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const finalVal = await tokenWizard.getContractArrayLength()
//                   assert.equal(initVal.add(1).toString(), finalVal.toString())
//               })
//           })
//           describe("viewTotalAmountYouOwe", function () {
//             it("correctly returns total amount you owe to lenders currently", async function() {
//                 await tokenWizard.createContract("uri", deployer.address, user1.address, [777,2,3,4,5,6,[7],[8]])
//                 await tokenWizard.connect(user1).approvePendingContract(0)
//                 const value = await tokenWizard.viewTotalAmountYouOwe()
//                 assert.equal(value.toString(), "777")
//             })
//           })
//           describe("viewTotalAmountOwedToYou", function() {
//             it("correctly returns total amount borrowers owe you", async function() {
//                 await tokenWizard.createContract("uri", deployer.address, user1.address, [777,2,3,4,5,6,[7],[8]])
//                 await tokenWizard.connect(user1).approvePendingContract(0)
//                 const value = await tokenWizard.connect(user1).viewTotalAmountOwedToYou()
//                 assert.equal(value.toString(), "777")
//             })
//           })
//           describe("viewNextPaymentInfo", function() {
//             it("returns next payment amount and timestamp correctly", async function() {
//                 await tokenWizard.createContract("uri", deployer.address, user1.address, [777, 2, 3, 4, 5, 6, [7], [2550641076]])
//                 await tokenWizard.connect(user1).approvePendingContract(0)
//                 const value = await tokenWizard.viewNextPaymentInfo(0)
//                 assert.equal(value.toString(), ["7", "2550641076"])
//             })
//           })
//           describe("viewBorrowerContract", function () {
//               it("returns the correct contract struct", async function () {
//                   await tokenWizard.createContract(
//                       "uri",
//                       deployer.address,
//                       user1.address,
//                       [7, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const value = await tokenWizard.viewBorrowerContract(0)
//                   assert.equal(
//                       value.toString(),
//                       [
//                           "uri",
//                           deployer.address,
//                           user1.address,
//                           0,
//                           7,
//                           7,
//                           2,
//                           3,
//                           4,
//                           5,
//                           6,
//                           7,
//                           8,                         
//                       ].toString()
//                   )
//               })
//           })
//           describe("viewLenderContract", function () {
//               it("returns the correct contract struct", async function () {
//                   await tokenWizard.createContract(
//                       "uri",
//                       deployer.address,
//                       user1.address,
//                       [777, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const value = await tokenWizard
//                       .connect(user1)
//                       .viewLenderContract(0)
//                   assert.equal(
//                       value.toString(),
//                       [
//                           "uri",
//                           deployer.address,
//                           user1.address,
//                           0,
//                           777,
//                           777,
//                           2,
//                           3,
//                           4,
//                           5,
//                           6,
//                           7,
//                           8,                         
//                       ].toString()
//                   )
//               })
//           })
//           describe("viewNumOfActiveBorrowerContracts", function () {
//               it("should return correct contractId's", async function () {
//                   const initVal =
//                       await tokenWizard.viewNumOfActiveBorrowerContracts()
//                   await tokenWizard.createContract(
//                       "uri",
//                       deployer.address,
//                       user1.address,
//                       [1, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const value =
//                       await tokenWizard.viewNumOfActiveBorrowerContracts()
//                   assert.equal((initVal + 1).toString(), value.toString())
//               })
//           })
//           describe("viewNumOfActiveLenderContracts", function () {
//               it("should return correct contractId's", async function () {
//                   const initVal =
//                       await tokenWizard.viewNumOfActiveLenderContracts()
//                   await tokenWizard.createContract(
//                       "uri",
//                       user1.address,
//                       deployer.address,
//                       [1, 2, 3, 4, 5, 6, [7], [8]]
//                   )
//                   await tokenWizard.connect(user1).approvePendingContract(0)
//                   const value =
//                       await tokenWizard.viewNumOfActiveLenderContracts()
//                   assert.equal((initVal + 1).toString(), value.toString())
//               })
//           })
//       })
