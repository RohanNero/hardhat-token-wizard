const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { ethers, network } = require("hardhat")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("token wizard unit tests", function () {
          let deployer, lender, user, tokenWizard, factory
          beforeEach(async function () {
              ;[deployer, lender, user] = await ethers.getSigners()
              factory = await ethers.getContractFactory("TokenWizard", deployer)
              tokenWizard = await factory.deploy(
                  "uri",
                  deployer.address,
                  lender.address,
                  [777, 2, 3, 4, 5, 6, [7], [8]]
              )
          })
          describe("constructor", function () {
              it("reverts if borrower address is same as lender address", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizard",
                      deployer
                  )
                  await expect(
                      factory.deploy(
                          "uri",
                          deployer.address,
                          deployer.address,
                          [777, 2, 3, 4, 5, 6, [7], [8]]
                      )
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__BorrowerCantBeLender"
                      )
                      .withArgs(deployer.address, deployer.address)
              })
              it("reverts if payment array lengths are not equal", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizard",
                      deployer
                  )
                  await expect(
                      factory.deploy("uri", deployer.address, lender.address, [
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8, 777],
                      ])
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__PaymentArrayLengthsNotEqual"
                      )
                      .withArgs(1, 2)
              })
              it("sets the contract terms equal to twContract", async function () {
                  const value = await tokenWizard.viewContractInfo()
                  assert.equal(
                      value.toString(),
                      [
                          "uri",
                          deployer.address,
                          lender.address,
                          777,
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          7,
                          8,
                      ].toString()
                  )
              })
              it("sets borrowerApproved to true if deployed by borrower", async function () {
                  const [value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              it("sets lenderApproved to true if deployed by lender", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizard",
                      deployer
                  )
                  tokenWizard = await factory
                      .connect(lender)
                      .deploy("uri", deployer.address, lender.address, [
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8],
                      ])
                  const [, value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              //   it("emits contractDrafted event correctly", async function () {
              //       const factory = await ethers.getContractFactory(
              //           "TokenWizard",
              //           deployer
              //       )
              //       const tx = await
              //           factory.deploy("uri", deployer.address, lender.address, [
              //               777,
              //               2,
              //               3,
              //               4,
              //               5,
              //               6,
              //               [7],
              //               [8],
              //           ])
              //       const txReceipt = await tx.wait()
              //       //const txReceipt = tx.wait()
              //       console.log(txReceipt)
              //       //   await expect(
              //       //       factory.deploy("uri", deployer.address, lender.address, [
              //       //           777,
              //       //           2,
              //       //           3,
              //       //           4,
              //       //           5,
              //       //           6,
              //       //           [7],
              //       //           [8],
              //       //       ])
              //       //   )
              //       //.to.emit(tokenWizard, "ContractDrafted")
              //       //.withArgs(777, deployer.address, lender.address)
              //   })
          })
          describe("approveContract", function () {
              it("reverts if msg.sender isnt the borrower or the lender", async function () {
                  await expect(tokenWizard.connect(user).approveContract())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(deployer.address, lender.address, user.address)
              })
              it("reverts if msg.sender already approved the contract", async function () {
                  await expect(tokenWizard.approveContract())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__AlreadyApprovedContract"
                      )
                      .withArgs()
              })
              it("emits contractApproved if neither party hasnt approved yet and called by borrower", async function () {
                  tokenWizard = await factory
                      .connect(user)
                      .deploy("uri", deployer.address, lender.address, [
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8],
                      ])
                  await expect(tokenWizard.connect(deployer).approveContract())
                      .to.emit(tokenWizard, "ContractApproved")
                      .withArgs(deployer.address)
              })
              it("emits contractApproved if neither party hasnt approved yet and called by lender", async function () {
                  tokenWizard = await factory
                      .connect(user)
                      .deploy("uri", deployer.address, lender.address, [
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8],
                      ])
                  await expect(tokenWizard.connect(lender).approveContract())
                      .to.emit(tokenWizard, "ContractApproved")
                      .withArgs(lender.address)
              })
              it("emits contractApproved if borrower hasnt approved yet", async function () {
                  tokenWizard = await factory
                      .connect(user)
                      .deploy("uri", deployer.address, lender.address, [
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8],
                      ])
                  await tokenWizard.connect(lender).approveContract()
                  await expect(tokenWizard.connect(deployer).approveContract())
                      .to.emit(tokenWizard, "ContractApproved")
                      .withArgs(deployer.address)
              })
              it("emits contractApproved if lender hasnt approved yet", async function () {
                  await expect(tokenWizard.connect(lender).approveContract())
                      .to.emit(tokenWizard, "ContractApproved")
                      .withArgs(lender.address)
              })
          })
          describe("proposeFinancialTermsRevision", function () {
              const revisedTerms = [777, 2, 3, 4, 5, 6, [7], [8]]
              it("reverts if msg.sender isnt borrower or lender", async function () {
                  await expect(
                      tokenWizard
                          .connect(user)
                          .proposeFinancialTermsRevision(revisedTerms)
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(deployer.address, lender.address, user.address)
              })
              it("reverts if msg.sender calls more than once per hour", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  await expect(
                      tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__OncePerHour"
                  )
              })
              it("reverts if msg.sender tries to revise borrowAmount", async function () {
                  await expect(
                      tokenWizard.proposeFinancialTermsRevision([
                          7,
                          2,
                          3,
                          4,
                          5,
                          6,
                          [7],
                          [8],
                      ])
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__CannotChangeBorrowAmount"
                      )
                      .withArgs(777, 7)
              })
              it("sets revisedFinancialTerms values using input", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  const value = await tokenWizard.viewProposedRevisalTerms()
                  assert.equal(value.toString(), revisedTerms.toString())
              })
              it("sets the proposer variable equal to msg.sender", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  const value = await tokenWizard.viewProposerAddress()
                  assert.equal(value, deployer.address)
              })
              it("sets the lastProposalTimestamp variable correctly", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  const value = await tokenWizard.viewLastProposalTimestamp()
                  assert.equal(Date.now() / 1000 - value < 100, true)
              })
              it("emits the RevisedFinancialTermsProposed event correctly", async function () {
                  await expect(
                      tokenWizard.proposeFinancialTermsRevision(revisedTerms)
                  ).to.emit(tokenWizard, "RevisedFinancialTermsProposed")
              })
          })
          describe("approveRevisedFinancialTerms", function () {
              const revisedTerms = [777, 21, 3, 4, 5, 6, [7], [8]]
              beforeEach(async function () {
                  await tokenWizard.proposeFinancialTermsRevision(revisedTerms)
              })
              it("reverts if msg.sender isnt borrower or lender", async function () {
                  await expect(
                      tokenWizard.connect(user).approveRevisedFinancialTerms()
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(deployer.address, lender.address, user.address)
              })
              it("reverts if there isn't pending contract revisions", async function() {
                await tokenWizard.connect(lender).approveRevisedFinancialTerms()
                await expect(tokenWizard.connect(lender).approveRevisedFinancialTerms()).to.be.revertedWithCustomError(tokenWizard, "TokenWizard__NoFinancialRevisionPending")
              })
              it("reverts if msg.sender is the proposer", async function () {
                  await expect(tokenWizard.approveRevisedFinancialTerms())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__ProposerCannotApprove"
                      )
                      .withArgs(deployer.address)
              })
              it("updates twContract's financialTerms correctly", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveRevisedFinancialTerms()
                  const value = await tokenWizard.viewContractInfo()
                  assert.equal(
                      value.financialTerms.interestRate.toString(),
                      "21"
                  )
              })
              it("resets the revisedFinancialTerms variable", async function () {
                  const initVal = await await tokenWizard
                      .connect(lender)
                      .approveRevisedFinancialTerms()
                  const value = await tokenWizard.viewProposedRevisalTerms()
                  assert.equal(value.borrowAmount.toString(), "0")
              })
              it("emits the ContractFinancialTermsRevised event correctly", async function () {
                  await expect(
                      tokenWizard.connect(lender).approveRevisedFinancialTerms()
                  ).to.emit(tokenWizard, "ContractFinancialTermsRevised")
              })
          })
          describe("", function () {
              it("", async function () {})
          })
          describe("viewAmountStillOwed", function () {
              it("returns amount borrower still owes to lender correctly", async function () {
                  const value = await tokenWizard.viewAmountStillOwed()
                  assert.equal(value.toString(), "777")
              })
          })
          describe("viewContractInfo", function () {
              it("returns current contract information correctly", async function () {
                  const value = await tokenWizard.viewContractInfo()
                  assert.equal(
                      value.toString(),
                      [
                          "uri",
                          deployer.address,
                          lender.address,
                          777,
                          777,
                          2,
                          3,
                          4,
                          5,
                          6,
                          7,
                          8,
                      ].toString()
                  )
              })
          })
          describe("viewApprovalStatus", function () {
              it("returns approval bools with correct values", async function () {
                  const value = await tokenWizard.viewApprovalStatus()
                  assert.equal(value.toString(), ["true", "false"])
              })
          })
      })
