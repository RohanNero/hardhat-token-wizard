# **Tokenization Wizard**

I wanted to create a platform where **any** user could potentially borrow any amount of liquidity *(currently capped at 2^32)* by using something they own as collateral.
At the same time **any** user can become a lender and lend to anyone they choose to, with a list of customizable contract **`financialTerms`**. 
**The goal of this project is to create the foundation of that, in such a way that anyone may build on top of it to better fit their desired needs.**

---

Any user may call `createTokenWizardAutoContract()` inside of `TokenWizardAutoFactory contract` by passing all the `TokenWizardAuto constructor` parameters:
 - **`string objectUri`:** URI containing name, description, and imageUri of the physical object being used as collateral
 - **`address borrower`:** address of the user borrowing liquidity by using their physical object as collateral  
 - **`address lender`:** address of the user lending their liqudity. *(receives interest if applicable)* 
 - **`FinancialTerms`** *(struct of uints representing the financial terms of the contract):* 
    - **`uint borrowAmount`:** amount of liquidity being borrowed/lent 
    - **`uint40 interestRate`:** interest rate on the borrowed liquidity
    - **`uint40 interestCompoundingInterval`:** interest compounding time interval
    - **`uint40 dueDate`:** unix timestamp that represents when liquidity is due
    - **`uint40 lateFeePerecent`:** percentage used to calculate how much is charged if a payment is late
    - **`uint40 lateFeeCompoundingInterval`:** late fee compounding interval *(in seconds)*
    - **`uint40[] paymentDates`:** array of unix timestamps representing when corresponding paymentAmounts are due
    - **`uint[] paymentAmounts`:** array of amounts linked to paymentDates array
    

---

Once the **TokenWizard** contract is deployed the contract details are publicly available for everyone to view. Once both parties have approved the contract by calling **`approveContract()`**, automation will start to check back in at the specified time interval and perform upkeep on the contract by updating the contract information such as the amount still owed or number of late payments. *(if the TokenWizard contract is deployed by the borrower then approveContract() is automatically called by that user, meaning only the lender will have to approve the contract)*

---

## **FAQ**

**How can a lender trust a borrower?**

 trust/rep can be implemented on the frontend off-chain in a similar fashion to stackOverflow.

**What if the borrower doesn't pay back the lender?**

*that borrower will lose their reputation and is publically proven to be untrustworthy on-chain forever.*

**How can the borrower prove they own the object in the objectURI?**

*unsure on this at the current moment, maybe chainlink proof of reserves can assist with this.*

**How will the frontend/UI work?**

*I was thinking any team/entity that can code may develop their own frontend to interact with the TokenWizard smart contracts. 
That way any trust/reputation and verification stuff can be handled by them. Frontends could filter users by doxxed/KYC provided or trust/rep, 
that way lenders could choose to only provide liquidity to borrowers who fit their standards.*

**Is there any updates/changes that could be made?**

Yes, there is a handful of changes that could be made, from the `approveContract()` and `TokenWizardAutoFactory` flow, to the types that the contract info is saved as. Some checks to make sure that the `interestRateCompoundingInterval` and the `lateFeeCompoundingInterval` are bigger than **X** would help prevent `performUpkeep()` from failing due to gas issues. Also having a check to make sure that the length of `paymentAmounts/dates` is less than **X** can also help prevent `performUpkeep()` from failing because of gas.

---

## **video demo:** 
1. call createTokenWizardAuto() with desired parameters on the factory contract. (using createTokenWizardAuto script)
code:
    - `yarn hardhat run scripts/TokenFactory/createTokenWizardAuto.js --network localhost`

2. view newly created contract's info to see that it was deployed correctly 
code:
    - `yarn hardhat viewContractInfo --network goerli --address X ` (optional paramter: `--stringify X`)

3. approveContract for both lender and borrower (thinking about making a task that takes `namedAccount` as input, and approvesContract)
(also optional param that takes value ) making one task that took parameters proved to be a challenge, much easier to make two seperate task that have hard coded logic.
code:
    - `yarn hardhat borrowerApprove --network goerli --address X`
    - `yarn hardhat lenderApprove --network goerli -address X`

4. fund chainlink automation subscription manager so it can `performUpkeep` on `contract`
    - no coding needed, just use chainlink automation's UI

5. wait X amount of time until interest has been added to our `twContract.amountOwed`

6. repeat step 2. to `viewContractInfo` and see that the `amountOwed` has been updated
7. send a transaction to contract with value that is greater than the `amountOwed` so that the `event ContractCompleted` will be emitted
    (can either send directly or via `makePayment()` function)