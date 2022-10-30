# **Tokenization Wizard**

I wanted to create a platform/method where **any** user could poentially borrow any amount of liquidity *(currently capped at 2^32)* by using a physical object they own as collateral.
At the same time any user can become a lender and lend to any user they choose to, with a list of customizable contract **`financialTerms`**. 
**The goal of this project is to create the foundation of that, in such a way that anyone may build on top of it to better fit their desired needs.**

---

Users may deploy a **TokenWizard** `contract` by passing all the contract parameters to the **`constructor`**:
 - **`string objectUri`:** URI containing name, description, and imageUri of the physical object being used as collateral
 - **`address borrower`:** address of the user borrowing liquidity by using their physical object as collateral  
 - **`address lender`:** address of the user lending their liqudity. *(receives interest if applicable)* 
 - **`FinancialTerms`** *(struct of uints representing the financial terms of the contract):* 
    - **`uint32 borrowAmount`:** amount of liquidity being borrowed/lent 
    - **`uint8 interestRate`:** interest rate on the borrowed liquidty
    - **`uint32 interestCompoundingInterval`:** interest compounding time
    - **`uint32 dueDate`:** unix timestamp that represents when liquidity is due
    - **`uint8 lateFeePerecent`:** percentage used to caluclate how much is charged if a payment is late
    - **`uint32 lateFeeCompoundingInterval`:** late fee compounding interval *(in seconds)*
    - **`uint32[] paymentAmounts`:** array of amounts linked to paymentDates array
    - **`uint32[] paymentDates`:** array of unix timestamps representing when corresponding paymentAmounts are due

---

Once the **TokenWizard** contract is deployed the contract details are publicly availiable for everyone to view. Once both parties have approved the contract by calling `approveContract()` automation will start to check back in at the specifiec time interval and perform upkeep on the contract by updating the contract details such as the amount still owed or number of late payments. *(if the TokenWizard contract is deployed by either the borrower or the lender then approveContract() is automatically called by that user, meaning only the other involved party will have to approve the contract)*