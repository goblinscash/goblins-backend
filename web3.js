const { ethers } = require("ethers");
// const addressToCheck = '0xd6E40493DeAfa0Ea66F31A97F49EBC0481716ee7';
const provider = new ethers.JsonRpcProvider("https://rpc-testnet.icbchain.io");
async function check() {
    // provider.getCode(addressToCheck, (error, bytecode) => {
    //     if (!error) {
    //         // Check if the returned bytecode is '0x' (empty) or '0x0'
    //         if (bytecode === '0x' || bytecode === '0x0') {
    //             console.log(`${addressToCheck} is a wallet address.`);
    //         } else {
    //             console.log(`${addressToCheck} is a contract address.`);
    //         }
    //     } else {
    //         console.error('Error checking address:', error);
    //     }
    // });
    try {
        // Get the latest block number
        let latestBlockNumber = await provider.getBlockNumber();

        let totalTransactions = 0;
        let startCount = 0;
        let endCount = latestBlockNumber < 100 ? latestBlockNumber : 100;

        // Loop through blocks and count transactions
        for (let i = startCount; i <= endCount; i++) {
            const block = await provider.getBlock(i);
            if(block.transactions.length > 0){
                totalTransactions += block.transactions.length;
                //update count in database
            }
            if (i == endCount) {
                console.log(endCount, "end Count");
                startCount = endCount + 1;
                if (endCount + 100 < latestBlockNumber) {
                    endCount = endCount + 100;
                } else {
                    endCount = latestBlockNumber;
                    latestBlockNumber = await provider.getBlockNumber();
                }
                console.log("Start Count=> ", startCount, "End Count=> ", endCount);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
check();