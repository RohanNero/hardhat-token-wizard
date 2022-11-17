const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { ethers, network } = require("hardhat")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("token wizard unit tests", function () {
          const FiveMinsInFuture = Math.floor(Date.now() / 1e3) + 300
          const TenMinsInFuture = Math.floor(Date.now() / 1e3) + 600
          const TWO_ETH = "2000000000000000000" // 2 with 18 zeros
          const ONE_ETH = "1000000000000000000" // 1 with 18 zeros (used for testing makePayment / withdraw)
          const BORROW_AMOUNT = "10000000000" // $100.00000000 = borrowing $100  (8 extra zeros/decimals)
          const HALF_BORROW_AMOUNT = "5000000000" // $50.00000000             (8 extra zeros/decimals)
          const DECIMALS = 8 // number of decimals
          const INITIAL_ANSWER = 5000000000 // mock price of eth = $50
          let deployer, lender, user, tokenWizard, factory, mockAggregator
          beforeEach(async function () {
              ;[deployer, lender, user] = await ethers.getSigners()
              mockFactory = await ethers.getContractFactory(
                  "MockV3Aggregator",
                  deployer
              )
              mockAggregator = await mockFactory.deploy(
                  DECIMALS,
                  INITIAL_ANSWER
              )
              factory = await ethers.getContractFactory(
                  "TokenWizardAuto",
                  deployer
              )
              tokenWizard = await factory.deploy(
                  "uri",
                  deployer.address,
                  lender.address,
                  [BORROW_AMOUNT, 2, 3, 2114380800, 5, 6, [7], [8]],
                  mockAggregator.address
              )
              await tokenWizard.approveContract()
          })
          describe("constructor", function () {
              it("reverts if borrower address is same as lender address", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizardAuto",
                      deployer
                  )
                  await expect(
                      factory.deploy(
                          "uri",
                          deployer.address,
                          deployer.address,
                          [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]],
                          mockAggregator.address
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
                      "TokenWizardAuto",
                      deployer
                  )
                  await expect(
                      factory.deploy(
                          "uri",
                          deployer.address,
                          lender.address,
                          [
                              BORROW_AMOUNT,
                              2,
                              3,
                              4,
                              5,
                              6,
                              [7],
                              [8, BORROW_AMOUNT],
                          ],
                          mockAggregator.address
                      )
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__PaymentArrayLengthsNotEqual"
                      )
                      .withArgs(1, 2)
              })
              it("reverts if only one interest parameter is zero", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizardAuto",
                      deployer
                  )
                  await expect(
                      factory.deploy(
                          "uri",
                          deployer.address,
                          lender.address,
                          [BORROW_AMOUNT, 1, 0, 4, 5, 6, [7], [8]],
                          mockAggregator.address
                      )
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__InvalidInterestParameters"
                  )
              })
              it("reverts if only one lateFee parameter is zero", async function () {
                  const factory = await ethers.getContractFactory(
                      "TokenWizardAuto",
                      deployer
                  )
                  await expect(
                      factory.deploy(
                          "uri",
                          deployer.address,
                          lender.address,
                          [BORROW_AMOUNT, 1, 2, 4, 5, 0, [7], [8]],
                          mockAggregator.address
                      )
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__InvalidLateFeeParameters"
                  )
              })
              it("sets the contract terms equal to twContract", async function () {
                  const value = await tokenWizard.twContract()
                  assert.equal(
                      value.toString(),
                      [
                          "uri",
                          deployer.address,
                          lender.address,
                          BORROW_AMOUNT,
                          BORROW_AMOUNT,
                          2,
                          3,
                          2114380800,
                          5,
                          6,
                          7,
                          8,
                      ].toString()
                  )
              })
              /**@dev outdated since I added contract factory to deploy instead of users directly */
            //   it("sets borrowerApproved to true if deployed by borrower", async function () {
            //       const [value] = await tokenWizard.viewApprovalStatus()
            //       assert.equal(value, true)
            //   })
              /** @dev Need to learn how to listen for events emitted inside the constructor to make this test */
              // it.only("emits contractDrafted event correctly", async function () {
              //     const factory = await ethers.getContractFactory(
              //         "TokenWizard",
              //         deployer
              //     )
              //     const tx = await
              //         factory.deploy("uri", deployer.address, lender.address, [
              //             BORROW_AMOUNT,
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
              //     //           BORROW_AMOUNT,
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
              //     //.withArgs(BORROW_AMOUNT, deployer.address, lender.address)
              // })
          })
          describe("receive", function () {
              it("reverts if lender sends funds and lenderApproved is true", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await expect(
                      lender.sendTransaction({
                          to: tokenWizard.address,
                          value: ONE_ETH,
                      })
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__AlreadyApprovedContract"
                  )
              })
              it("sets lenderApproved to true if (msg.value >= borrowAmount)", async function () {
                  const [, initVal] = await tokenWizard.viewApprovalStatus()
                  await lender.sendTransaction({
                      to: tokenWizard.address,
                      value: TWO_ETH,
                  })
                  const [, finalVal] = await tokenWizard.viewApprovalStatus()
                  // console.log(initVal, finalVal)
                  assert.equal(finalVal, true)
              })
              it("sets lenderApproved to true if address(this).balance >= borrowAmount", async function () {
                  await lender.sendTransaction({
                      to: tokenWizard.address,
                      value: ONE_ETH,
                  })
                  const [, initVal] = await tokenWizard.viewApprovalStatus()
                  await lender.sendTransaction({
                      to: tokenWizard.address,
                      value: ONE_ETH,
                  })
                  const [, finalVal] = await tokenWizard.viewApprovalStatus()
                  //console.log(initVal, finalVal)
                  assert.equal(finalVal, true)
              })
              //   it("reverts if lender sends funds before borrower approves", async function () {
              //       tokenWizard = await factory.deploy(
              //           "uri",
              //           user.address,
              //           lender.address,
              //           [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]],
              //           mockAggregator.address
              //       )
              //       await expect(
              //           lender.sendTransaction({
              //               to: tokenWizard.address,
              //               value: TWO_ETH,
              //           })
              //       ).to.be.revertedWithCustomError(
              //           tokenWizard,
              //           "TokenWizard__BorrowerMustApproveFirst"
              //       )
              //   })
              it("emits PaymentMade event correctly", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await expect(
                      deployer.sendTransaction({
                          to: tokenWizard.address,
                          value: ONE_ETH,
                      })
                  )
                      .to.emit(tokenWizard, "PaymentMade")
                      .withArgs(5000000000, 5000000000)
              })
              it("emits ContractCompleted event correctly ", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await expect(
                      deployer.sendTransaction({
                          to: tokenWizard.address,
                          value: TWO_ETH,
                      })
                  )
                      .to.emit(tokenWizard, "ContractCompleted")
                      .withArgs(BORROW_AMOUNT, 1)
              })
          })
          describe("approveContract", function () {
              it("reverts if msg.sender isnt the borrower or the lender", async function () {
                  await expect(tokenWizard.connect(user).approveContract())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(user.address)
              })
              it("reverts if msg.sender already approved the contract", async function () {
                  await expect(tokenWizard.approveContract())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__AlreadyApprovedContract"
                      )
                      .withArgs()
              })
              it("reverts if lender tries to approve before borrower", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      lender.address,
                      [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]],
                      mockAggregator.address
                  )
                  await expect(
                      tokenWizard.connect(lender).approveContract()
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__BorrowerMustApproveFirst"
                  )
              })
              it("reverts if lender has already approved", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await expect(
                      tokenWizard.connect(lender).approveContract()
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__AlreadyApprovedContract"
                  )
              })
              it("reverts if lender doesnt send borrowAmount", async function () {
                  await expect(
                      tokenWizard
                          .connect(lender)
                          .approveContract({ value: 777 })
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__LenderMustSendBorrowAmount"
                  )
              })
              it("sets borrowerApproved equal to 'true' when called before lender", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      user.address,
                      lender.address,
                      [420, 2, 3, 4, 5, 6, [7], [8]],
                      mockAggregator.address
                  )
                  await tokenWizard.connect(user).approveContract()
                  const [value] = await tokenWizard.viewApprovalStatus()
                  assert.equal(value, true)
              })
              it("emits borrowAmountTransferred correctly when borrower approves", async function () {
                  tokenWizard = await factory.deploy(
                      "uri",
                      lender.address,
                      deployer.address,
                      [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]],
                      mockAggregator.address,
                      { value: TWO_ETH }
                  )
                  await expect(tokenWizard.connect(lender).approveContract())
                      .to.emit(tokenWizard, "BorrowAmountTransferred")
                      .withArgs(deployer.address, BORROW_AMOUNT, lender.address)
              })
              it("emits borrowAmountTransferred correctly when lender approves", async function () {
                  await expect(
                      tokenWizard
                          .connect(lender)
                          .approveContract({ value: TWO_ETH })
                  )
                      .to.emit(tokenWizard, "BorrowAmountTransferred")
                      .withArgs(lender.address, BORROW_AMOUNT, deployer.address)
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
              //               BORROW_AMOUNT,
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
              //               BORROW_AMOUNT,
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
              //               BORROW_AMOUNT,
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
              const revisedTerms = [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]]
              it("reverts if msg.sender isnt borrower or lender", async function () {
                  await expect(
                      tokenWizard
                          .connect(user)
                          .proposeFinancialTermsRevision(777, revisedTerms)
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(user.address)
              })
              it("reverts if msg.sender calls more than once per hour", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(
                      777,
                      revisedTerms
                  )
                  await expect(
                      tokenWizard.proposeFinancialTermsRevision(
                          777,
                          revisedTerms
                      )
                  ).to.be.revertedWithCustomError(
                      tokenWizard,
                      "TokenWizard__OncePerHour"
                  )
              })
              it("reverts if msg.sender tries to revise borrowAmount", async function () {
                  await expect(
                      tokenWizard.proposeFinancialTermsRevision(777, [
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
                      .withArgs(BORROW_AMOUNT, 7)
              })
              it("sets revisedFinancialTerms values using input", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(
                      777,
                      revisedTerms
                  )
                  const value = await tokenWizard.revisedFinancialTerms()
                  assert.equal(value.toString(), revisedTerms.slice(0,-2).toString())
              })
              it("sets the proposer variable equal to msg.sender", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(
                      777,
                      revisedTerms
                  )
                  const value = await tokenWizard.viewProposerAddress()
                  assert.equal(value, deployer.address)
              })
              it("sets the lastProposalTimestamp variable correctly", async function () {
                  await tokenWizard.proposeFinancialTermsRevision(
                      777,
                      revisedTerms
                  )
                  const value = await tokenWizard.viewLastProposalTimestamp()
                  assert.equal(Date.now() / 1000 - value < 100, true)
              })
              /**@dev too gas expensive for now to leave in */
            //   it("emits the RevisedFinancialTermsProposed event correctly", async function () {
            //       await expect(
            //           tokenWizard.proposeFinancialTermsRevision(
            //               777,
            //               revisedTerms
            //           )
            //       ).to.emit(tokenWizard, "RevisedFinancialTermsProposed")
            //   })
          })
          describe("approveRevisedFinancialTerms", function () {
              const revisedTerms = [BORROW_AMOUNT, 21, 3, 4, 5, 6, [7], [8]]
              beforeEach(async function () {
                  await tokenWizard.proposeFinancialTermsRevision(
                      777,
                      revisedTerms
                  )
              })
              it("reverts if msg.sender isnt borrower or lender", async function () {
                  await expect(
                      tokenWizard.connect(user).approveRevisedFinancialTerms()
                  )
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(user.address)
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
                  const value = await tokenWizard.twContract()
                  assert.equal(
                      value.financialTerms.interestRate.toString(),
                      "21"
                  )
              })
              it("resets the revisedFinancialTerms variable", async function () {
                  const initVal = await await tokenWizard
                      .connect(lender)
                      .approveRevisedFinancialTerms()
                  const value = await tokenWizard.revisedFinancialTerms()
                  assert.equal(value.borrowAmount.toString(), "0")
              })
              /**event is gone for now due to gas reasons... */
            //   it("emits the ContractFinancialTermsRevised event correctly", async function () {
            //       await expect(
            //           tokenWizard.connect(lender).approveRevisedFinancialTerms()
            //       ).to.emit(tokenWizard, "ContractFinancialTermsRevised")
            //   })
          })
          describe("makePayment", function () {
              beforeEach(async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
              })
              it("reverts if contract isnt approved", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [BORROW_AMOUNT, 2, 3, 4, 5, 6, [7], [8]],
                      mockAggregator.address
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
                          lender.address
                      )
              })
              it("updates totalPaid variable", async function () {
                  const totalPaid =
                      await tokenWizard.viewTotalAmountPaid()
                  await tokenWizard.makePayment({ value: ONE_ETH })
                  const totalPaidV2 =
                      await tokenWizard.viewTotalAmountPaid()
                  assert.equal(
                      (totalPaid.add(5000000000)).toString(),
                      totalPaidV2.toString()
                  )
              })
              it("updates the twContract.amountOwed variable", async function () {
                  const initVal = await tokenWizard.viewAmountStillOwed()
                  await tokenWizard.makePayment({ value: ONE_ETH })
                  const finalVal = await tokenWizard.viewAmountStillOwed()
                  assert.equal(
                      initVal.sub(5000000000).toString(),
                      finalVal.toString()
                  )
              })
              it("emits PaymentMade event", async function () {
                  await expect(tokenWizard.makePayment({ value: ONE_ETH }))
                      .to.emit(tokenWizard, "PaymentMade")
                      .withArgs(5000000000, 5000000000)
              })
              it("sets twContract.amountOwed to 0 if contract is paid off", async function () {
                  await tokenWizard.makePayment({ value: TWO_ETH })
                  assert.equal(await tokenWizard.viewAmountStillOwed(), 0)
              })
              it("emits ContractCompleted event if contract is paid off", async function () {
                  await expect(tokenWizard.makePayment({ value: TWO_ETH }))
                      .to.emit(tokenWizard, "ContractCompleted")
                      .withArgs(BORROW_AMOUNT, 1)
              })
          })
          describe("withdraw", function () {
              it("reverts if called by anyone besides lender", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await expect(tokenWizard.withdraw())
                      .to.be.revertedWithCustomError(
                          tokenWizard,
                          "TokenWizard__InvalidCallerAddress"
                      )
                      .withArgs(
                          deployer.address
                      )
              })
              it("emits withdrawalSuccessful if called by the lender", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await tokenWizard.makePayment({ value: ONE_ETH })
                  await expect(tokenWizard.connect(lender).withdraw())
                      .to.emit(tokenWizard, "WithdrawalSuccessful")
                      .withArgs(lender.address, 5000000000)
              })
          })
          describe("performUpkeep", function () {
              it("updates amountOwed with interest correctly", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          2500000000,
                          600,
                          TenMinsInFuture,
                          5,
                          6,
                          [0],
                          [0],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initVal = await tokenWizard.twContract()
                  const currentTimestamp = await tokenWizard.viewTimestamp()
                  await network.provider.send("evm_mine", [
                      currentTimestamp + 600,
                  ])
                  await tokenWizard.performUpkeep("0x")
                  const val = await tokenWizard.twContract()
                  assert.equal(val.amountOwed.toString().slice(0, -7), "1250")
              })
              it("updates amountOwed with late fees if past twContract dueDate", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          0,
                          0,
                          timestamp + 600,
                          5000000000,
                          600,
                          [0],
                          [0],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initVal = await tokenWizard.twContract()
                  const currentTimestamp = await tokenWizard.viewTimestamp()
                  await network.provider.send("evm_mine", [
                      currentTimestamp + 600,
                  ])
                  await tokenWizard.performUpkeep("0x")
                  const finalVal = await tokenWizard.twContract()
                  assert.equal(finalVal.amountOwed.toString(), "15000000000")
              })
              it("updates amountOwed with late fees if past twContract dueDate and performUpkeep has been called before", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          0,
                          0,
                          timestamp + 1200,
                          5000000000,
                          600,
                          [0],
                          [0],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initVal = await tokenWizard.twContract()
                  //console.log("initVal:", (initVal.amountOwed).toString())
                  const currentTimestamp = await tokenWizard.viewTimestamp()
                  //console.log("jsscripTimeStamp:", timestamp + 1200)
                  //console.log("currentTimestamp:", currentTimestamp)
                  await network.provider.send("evm_mine", [
                      currentTimestamp + 600,
                  ])
                  //console.log("codeReached! FUCK this shit ")
                  await tokenWizard.performUpkeep("0x")
                  //const currentTimestamp = await tokenWizard.viewTimestamp()
                  await network.provider.send("evm_mine", [
                      currentTimestamp + 1200,
                  ])
                  await tokenWizard.performUpkeep("0x")
                  const finalVal = await tokenWizard.twContract()
                  //console.log("finalVal:", (finalVal.amountOwed).toString())
                  assert.equal(
                      finalVal.amountOwed.toString().slice(0, -7),
                      "2250"
                  )
              })
              it("updates amountOwed with late fees if past most recent financialTerms paymentDate", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          0,
                          0,
                          timestamp + 7777777,
                          5000000000,
                          600,
                          [timestamp + 1200],
                          [HALF_BORROW_AMOUNT],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initVal = await tokenWizard.twContract()
                  //console.log("initVal", (initVal.amountOwed).toString())
                  // check solidity math, something is wrong
                  const currentTimestamp = await tokenWizard.viewTimestamp()
                  //console.log("currentTimestampp:", currentTimestamp)
                  //console.log("paymentDueDate:", initVal.financialTerms.paymentDates)
                  await tokenWizard.performUpkeep("0x")
                  const finalVal = await tokenWizard.twContract()
                  //console.log("finalVal", (finalVal.amountOwed).toString())
                  assert.equal(
                      finalVal.amountOwed.toString().slice(0, -7),
                      "1625"
                  )
              })
              it("emits interest added event correctly", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          2500000000,
                          2400,
                          timestamp,
                          0,
                          0,
                          [0],
                          [0],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initTimestamp = await tokenWizard.viewTimestamp()
                  const dueDate = await tokenWizard.twContract()
                  //console.log("initTimestamp:", initTimestamp)
                  //console.log("interestPercent:", dueDate.financialTerms.interestRate)
                  //console.log("interestInterval:", dueDate.financialTerms.interestCompoundingInterval)
                  //console.log("dueDatetmestp:", dueDate.financialTerms.dueDate)
                  //console.log("difference:", initTimestamp - dueDate.financialTerms.dueDate)
                  await network.provider.send("evm_mine", [
                      initTimestamp + 2400,
                  ])
                  await expect(tokenWizard.performUpkeep("0x"))
                      .to.emit(tokenWizard, "InterestAdded")
                      .withArgs(dueDate.amountOwed, 12500000000, 1)
              })
              it("emits late fee added event correctly", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          0,
                          0,
                          timestamp + 7777777,
                          2500000000,
                          600,
                          [timestamp + 4800],
                          [HALF_BORROW_AMOUNT],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const initTimestamp = await tokenWizard.viewTimestamp()
                  const dueDate = await tokenWizard.twContract()
                  //console.log("initTimestamp:", initTimestamp)
                  //console.log("interestPercent:", dueDate.financialTerms.lateFeePercent)
                  //console.log("interestInterval:", dueDate.financialTerms.lateFeeCompoundingInterval)
                  //console.log("dueDatetmestp:", dueDate.financialTerms.dueDate)
                  //console.log("difference:", initTimestamp - dueDate.financialTerms.dueDate)
                  await network.provider.send("evm_mine", [initTimestamp + 600])
                  await tokenWizard.performUpkeep("0x")
                  await network.provider.send("evm_mine", [
                      initTimestamp + 1800,
                  ])
                  await expect(tokenWizard.performUpkeep("0x")).to.emit(
                      tokenWizard,
                      "LateFeeCharged"
                  )
              })
          })
          /**@dev the first two `it` statements check if `interestTimePassed` is true and the following two check if false */
          describe("checkUpkeep", function () {
              const FiveMinsInFuture = Math.floor(Date.now() / 1e3) + 300
              beforeEach(async function () {
                  tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          2,
                          3,
                          TenMinsInFuture,
                          5,
                          6,
                          [FiveMinsInFuture],
                          [HALF_BORROW_AMOUNT],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
              })
              it("sets paymentDue to true if timestamp is past the dueDate", async function () {
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          0,
                          0,
                          TenMinsInFuture - 600,
                          5,
                          6,
                          [0],
                          [0],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const oldDate = await tokenWizard.viewTimestamp()
                  //console.log("oldDate:", oldDate)
                  //await network.provider.send("evm_mine", [oldDate + 1000])
                  const [bool] = await tokenWizard.checkUpkeep("0x")
                  const contractInfo = await tokenWizard.twContract()
                  //console.log("dueDate:",contractInfo.financialTerms.dueDate)
                  const date = await tokenWizard.viewTimestamp()
                  //console.log('current:', date)
                  assert.equal(bool, true)
              })
              it("sets paymentDue to false if timestamp isnt past the dueDate and there are no minimum payments", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [BORROW_AMOUNT, 0, 0, timestamp + 10000, 0, 0, [0], [0]],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const [bool] = await tokenWizard.checkUpkeep("0x")
                  assert.equal(bool, false)
              })
              it("sets paymentDue to true if you haven't paid enough toward payment by current dueDate", async function () {
                  const timestamp = Math.floor(Date.now() / 1e3)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          2500000000,
                          600,
                          timestamp + 7200,
                          5,
                          6,
                          [HALF_BORROW_AMOUNT],
                          [timestamp],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  const currentTimestamp = await tokenWizard.viewTimestamp()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await network.provider.send("evm_mine", [
                      currentTimestamp + 3600,
                  ])
                  const [bool] = await tokenWizard.checkUpkeep("0x")
                  assert.equal(bool, true)
              })
              it("sets paymentDue to false if you paid enough toward payment by current dueDate", async function () {
                  const initTimestamp = Math.floor(Date.now() / 1e3)
                  //console.log("timestamp: ",initTimestamp)
                  const tokenWizard = await factory.deploy(
                      "uri",
                      deployer.address,
                      lender.address,
                      [
                          BORROW_AMOUNT,
                          2500000000,
                          600,
                          initTimestamp + 36000,
                          5,
                          6,
                          [initTimestamp],
                          [HALF_BORROW_AMOUNT],
                      ],
                      mockAggregator.address
                  )
                  await tokenWizard.approveContract()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await tokenWizard.makePayment({ value: ONE_ETH })
                  const timestamp = await tokenWizard.viewTimestamp()
                  await network.provider.send("evm_mine", [timestamp + 300])
                  const [bool] = await tokenWizard.checkUpkeep("0x")
                  assert.equal(bool, false)
              })
              //   it("adds up amount owed if a payment is due", async function() {
              //     const tokenWizard = await factory.deploy(
              //         "uri",
              //         deployer.address,
              //         lender.address,
              //         [
              //             BORROW_AMOUNT,
              //             2500000000,
              //             600,
              //             TenMinsInFuture + 36000,
              //             5,
              //             6,
              //             [HALF_BORROW_AMOUNT],
              //             [FiveMinsInFuture],
              //         ],
              //         mockAggregator.address
              //     )
              //     await tokenWizard
              //         .connect(lender)
              //         .approveContract({ value: TWO_ETH })
              //     await network.provider.send("evm_increaseTime", [300])
              //     await network.provider.send("evm_mine", [FiveMinsInFuture + 300])

              //   })
          })
          describe("viewEthToUsdPrice", function () {
              it("returns price of eth correctly", async function () {})
          })
          describe("viewAmountStillOwed", function () {
              it("returns amount borrower still owes to lender correctly", async function () {
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  const value = await tokenWizard.viewAmountStillOwed()
                  assert.equal(value.toString(), BORROW_AMOUNT)
              })
          })
          describe("twContract", function () {
              it("returns current contract information correctly", async function () {
                  const value = await tokenWizard.twContract()
                  assert.equal(
                      value.toString(),
                      [
                          "uri",
                          deployer.address,
                          lender.address,
                          BORROW_AMOUNT,
                          BORROW_AMOUNT,
                          2,
                          3,
                          2114380800,
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
          describe("viewContractBalance", function () {
              it("returns contract balance correctly", async function () {
                  const initVal = await tokenWizard.viewContractBalance()
                  await tokenWizard
                      .connect(lender)
                      .approveContract({ value: TWO_ETH })
                  await tokenWizard.makePayment({ value: ONE_ETH })
                  const Val = await tokenWizard.viewContractBalance()
                  assert.equal(initVal.add(ONE_ETH).toString(), Val.toString())
              })
          })
      })
