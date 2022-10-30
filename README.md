# Tokenization Wizard

1. call createContract() to tokenize physical item's lending contract on-chain (this adds contract to pendingContractArray- which should be cleared/reset every hour using chainlink automation)
2. Both parties agree to the contract using approvePendingContract()   (this adds contract to contractArray)




% left off right here: 
just got 100% coverage on existing functions, time to create additional functions and write new unit tests for them

1. createContract() sets idToContract mapping and then approvePendingContract() pushes Contract struct into contractArray 