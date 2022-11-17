const { ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config.js")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("TokenWizardFactory unit tests", function () {
        let tokenFactory,mockAggregator, deployer, lender
        const TWO_ETH = "2000000000000000000" // 2 with 18 zeros
          const ONE_ETH = "1000000000000000000" // 1 with 18 zeros (used for testing makePayment / withdraw)
          const BORROW_AMOUNT = "10000000000" // $100.00000000 = borrowing $100  (8 extra zeros/decimals)
          const HALF_BORROW_AMOUNT = "5000000000" // $50.00000000             (8 extra zeros/decimals)
          const DECIMALS = 8 // number of decimals
          const INITIAL_ANSWER = 5000000000 // mock price of eth = $50
        beforeEach(async function() {
            [deployer,lender] = await ethers.getSigners()
            mockFactory = await ethers.getContractFactory("MockV3Aggregator")
            mockAggregator = await mockFactory.deploy(DECIMALS, INITIAL_ANSWER)
            const factory = await ethers.getContractFactory("TokenWizardAutoFactory")
            tokenFactory = await factory.deploy()

        })
        describe("createTokenWizardAutoContract", function() {
            it("create a new TokenWizardAuto contract and add it to addressArray", async function() {
                const tx = await tokenFactory.createTokenWizardAutoContract(
                    "uri",
                    deployer.address,
                    lender.address,
                    [
                        BORROW_AMOUNT,
                        2500000000,
                        600,
                        77777777777,
                        5,
                        6,
                        [0],
                        [0],
                    ],
                    mockAggregator.address
                )
                //const txReceipt = await tx.wait()
                //console.log(txReceipt.events[1].args.contractAddress)
                const initVal = await tokenFactory.addressArray(0)
                //console.log(initVal.toString())
                await tokenFactory.createTokenWizardAutoContract(
                    "uri",
                    deployer.address,
                    lender.address,
                    [
                        BORROW_AMOUNT,
                        2500000000,
                        600,
                        77777777777,
                        5,
                        6,
                        [0],
                        [0],
                    ],
                    mockAggregator.address
                )
                const val = await tokenFactory.addressArray(1)
                //console.log(val.toString())   
                assert.notEqual(initVal, val) 
            })
        })
    })
