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
                      .deploy(
                          "uri",
                          deployer.address,
                          lender.address,
                          [777, 2, 3, 4, 5, 6, [7], [8]],
                          { value: 777 }
                      )
                  const [, value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              /** @dev Need to learn how to listen for events emitted inside the constructor to make this test */
              // it.only("emits contractDrafted event correctly", async function () {
              //     const factory = await ethers.getContractFactory(
              //         "TokenWizard",
              //         deployer
              //     )
              //     const tx = await
              //         factory.deploy("uri", deployer.address, lender.address, [
              //             777,
              //             2,
              //             3,
              //             4,
              //             5,
              //             6,
              //             [7],
              //             [8],
              //         ])
              //     const txReceipt = await tx.wait()
              //     //const txReceipt = tx.wait()
              //     console.log(txReceipt)
              //     //   await expect(
              //     //       factory.deploy("uri", deployer.address, lender.address, [
              //     //           777,
              //     //           2,
              //     //           3,
              //     //           4,
              //     //           5,
              //     //           6,
              //     //           [7],
              //     //           [8],
              //     //       ])
              //     //   )
              //     //.to.emit(tokenWizard, "ContractDrafted")
              //     //.withArgs(777, deployer.address, lender.address)
              // })
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
              it("sets borrowerApproved equal to 'true' if called before lender", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      lender.address,
                      [420, 2, 3, 4, 5, 6, [7], [8]]
                  )
                  await tokenWizard.connect(user).approveContract()
                  const [value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              it("sets lenderApproved equal to 'true' if called before borrower as long as enough ETH sent ", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      lender.address,
                      [777, 2, 3, 4, 5, 6, [7], [8]]
                  )
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: 777 })
                  const [, value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              it("reverts if lender approves before borrower and doesnt send enough ETH", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      lender.address,
                      [777, 2, 3, 4, 5, 6, [7], [8]]
                  )
                  await expect(
                      tokenWizard.connect(lender).approveContract()
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__LenderMustSendBorrowAmount"
                  )
              })
              it("emits borrowAmountTransferred if borrower approves after lender", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      deployer.address,
                      [777, 2, 3, 4, 5, 6, [7], [8]],
                      { value: 777 }
                  )
                  await expect(tokenWizard.connect(user).approveContract())
                      .to.emit(tokenWizard, "BorrowAmountTransferred")
                      .withArgs(deployer.address, 777, user.address)
              })
              it("emits borrowAmountTransferred if lender approves after borrower", async function () {
                  await expect(
                      tokenWizard
                          .connect(lender)
                          .approveContract({ value: 777 })
                  )
                      .to.emit(tokenWizard, "BorrowAmountTransferred")
                      .withArgs(lender.address, 777, deployer.address)
              })
              /** @notice I struggle to test the .calls failing */
              //   it.only("reverts if borrow transfer fails", async function () {
              //     const testHelperFactory = await ethers.getContractFactory("TestHelper", deployer)
              //     const testWizard = await factory.deploy("uri", '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', lender.address, [420,2,3,4,5,6,[7],[8]])
              //     const testHelper = await testHelperFactory.deploy(testWizard.address)
              //     console.log(testHelper.address)
              //     await testWizard.connect(lender).approveContract({value: 420})
              //     await expect(testWizard.approveContract()).to.be.revertedWithCustomError(testWizard, "TokenWizard__BorrowAmountTransferFailed")
              //   })
              //   it("emits contractApproved if neither party hasnt approved yet and called by borrower", async function () {
              //       tokenWizard = await factory
              //           .connect(user)
              //           .deploy("uri", deployer.address, lender.address, [
              //               777,
              //               2,
              //               3,
              //               4,
              //               5,
              //               6,
              //               [7],
              //               [8],
              //           ])
              //       await expect(tokenWizard.connect(deployer).approveContract())
              //           .to.emit(tokenWizard, "ContractApproved")
              //           .withArgs(deployer.address)
              //   })
              //   it("emits contractApproved if neither party hasnt approved yet and called by lender", async function () {
              //       tokenWizard = await factory
              //           .connect(user)
              //           .deploy("uri", deployer.address, lender.address, [
              //               777,
              //               2,
              //               3,
              //               4,
              //               5,
              //               6,
              //               [7],
              //               [8],
              //           ])
              //       await expect(tokenWizard.connect(lender).approveContract())
              //           .to.emit(tokenWizard, "ContractApproved")
              //           .withArgs(lender.address)
              //   })
              //   it("emits contractApproved if borrower hasnt approved yet", async function () {
              //       tokenWizard = await factory
              //           .connect(user)
              //           .deploy("uri", deployer.address, lender.address, [
              //               777,
              //               2,
              //               3,
              //               4,
              //               5,
              //               6,
              //               [7],
              //               [8],
              //           ])
              //       await tokenWizard.connect(lender).approveContract()
              //       await expect(tokenWizard.connect(deployer).approveContract())
              //           .to.emit(tokenWizard, "ContractApproved")
              //           .withArgs(deployer.address)
              //   })
              //   it("emits contractApproved if lender hasnt approved yet", async function () {
              //       await expect(tokenWizard.connect(lender).approveContract())
              //           .to.emit(tokenWizard, "ContractApproved")
              //           .withArgs(lender.address)
              //   })
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
              it("reverts if there isn't pending contract revisions", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveRevisedFinancialTerms()
                  await expect(
                      tokenWizard.connect(lender).approveRevisedFinancialTerms()
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__NoFinancialRevisionPending"
                  )
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
          describe("withdraw", function () {
            it("reverts if called by anyone besides lender", async function() {
                await tokenWizard.connect(lender).approveContract({value: 777})
                await expect(tokenWizard.withdraw()).to.be.revertedWithCustomError(tokenWizard, "TokenWizard__InvalidCallerAddress").withArgs(deployer.address, lender.address, deployer.address);
            })
              it("emits withdrawalSuccessful if called by the lender", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: 777 })
                  await tokenWizard.makePayment({ value: 7 })
                  await expect(tokenWizard.connect(lender).withdraw())
                      .to.emit(tokenWizard, "WithdrawalSuccessful")
                      .withArgs(lender.address, 7)
              })
          })
          describe("makePayment", function () {
              beforeEach(async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: 777 })
              })
              it("reverts if contract isnt approved", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [777, 2, 3, 4, 5, 6, [7], [8]]
                  )
                  await expect(
                      tokenWizard.makePayment()
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__ContractMustBeApproved"
                  )
              })
              it("reverts if anyone besides borrower calls", async function () {
                  await expect(tokenWizard.connect(lender).makePayment())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(
                          deployer.address,
                          lender.address,
                          lender.address
                      )
              })
              it("updates totalPaid and totalPaidThisTerm variables", async function () {
                  const [totalPaid, totalPaidThisTerm] =
                      await tokenWizard.viewTotalAmountPaid()
                  await tokenWizard.makePayment({ value: 77 })
                  const [totalPaidV2, totalPaidThisTermV2] =
                      await tokenWizard.viewTotalAmountPaid()
                  assert.equal(
                      [totalPaid.add(77), totalPaidThisTerm.add(77)].toString(),
                      [totalPaidV2, totalPaidThisTermV2].toString()
                  )
              })
              it("updates the twContract.amountOwed variable", async function () {
                  const initVal = await tokenWizard.viewAmountStillOwed()
                  await tokenWizard.makePayment({ value: 77 })
                  const finalVal = await tokenWizard.viewAmountStillOwed()
                  assert.equal(initVal.sub(77).toString(), finalVal.toString())
              })
              it("emits PaymentMade event", async function () {
                  await expect(tokenWizard.makePayment({ value: 7 }))
                      .to.emit(tokenWizard, "PaymentMade")
                      .withArgs(7, 770)
              })
              it("sets twContract.amountOwed to 0 if contract is paid off", async function () {
                  await tokenWizard.makePayment({ value: 777 })
                  assert.equal(await tokenWizard.viewAmountStillOwed(), 0)
              })
              it("emits ContractCompleted event if contract is paid off", async function () {
                  await expect(tokenWizard.makePayment({ value: 777 }))
                      .to.emit(tokenWizard, "ContractCompleted")
                      .withArgs(777, 1)
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
          describe("viewContractBalance", function() {
            it("returns contract balance correctly", async function() {
                const initVal = await tokenWizard.viewContractBalance()
                await tokenWizard.connect(lender).approveContract({value: 777})
                await tokenWizard.makePayment({value: 77})
                const Val = await tokenWizard.viewContractBalance()
                assert.equal((initVal.add(77)).toString(), Val.toString())
            })
          })
      })
