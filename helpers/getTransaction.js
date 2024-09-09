const { ethers } = require('ethers');

// Connect to Ethereum network
const provider = new ethers.providers.JsonRpcProvider("https://smartbch.greyh.at");

const contractAddress = "0xfA3D02c971F6D97076b8405500c2210476C6A5E8"; // Replace with your contract address

async function scanContractTransactions(startBlock, endBlock) {
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
        // Get the block with transactions


        const block = await provider.getBlockWithTransactions(blockNumber);
        console.log(block, "<=====block")

        // Check each transaction
        block.transactions.forEach((tx) => {
            if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                console.log(`Transaction Hash: ${tx.hash}`);
                console.log(`From: ${tx.from}`);
                console.log(`To: ${tx.to}`);
                console.log(`Block Number: ${blockNumber}`);
            }
        });
    }
}

(async () => {
    const startBlock =16827025; // Set to contract deployment block
    const endBlock = await provider.getBlockNumber();

    console.log(endBlock, "<=====endBlock")
    await scanContractTransactions(startBlock, endBlock);
})();
