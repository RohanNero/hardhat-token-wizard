const developmentChains = ["hardhat", "localhost"]

const networkConfig = {
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
        /**@notice these args are only for testing purposes */
        uri: "https://ipfs.io/ipfs/bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json",
        borrower: "0xe4A98D2bFD66Ce08128FdFFFC9070662E489a28E",
        lender: "0xac3d5989F52890fd15D5f3108601884E649D7b2b",
        financialTerms: [
            100000000,
            2500000000,
            100,
            2145916800,
            5000000000,
            100,
            [0],
            [0],
        ],
        priceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
}

module.exports = {
    developmentChains,
    networkConfig,
}
