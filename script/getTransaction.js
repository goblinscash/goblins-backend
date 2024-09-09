const { ethers } = require("ethers");
const redisFunc = require("../utility/redis");

// Connect to Ethereum provider (e.g., Infura or Alchemy)
const provider = new ethers.providers.JsonRpcProvider(
  "https://smartbch.greyh.at"
);
// Define the contract address you want to track
const contractAddress = "0xfA3D02c971F6D97076b8405500c2210476C6A5E8"; // Replace with the actual contract address
async function getTransactionTimestamp(log) {
  const blockNumber = log.blockNumber;
  const block = await provider.getBlock(blockNumber);
  return block.timestamp;
}

async function getLogs(chainId) {
  const filter = {
    fromBlock: 0, // Starting block (replace with actual deployment block if known)
    toBlock: "latest", // Latest block
    address: contractAddress, // Contract address to track
    topics: [
      "0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d",
    ],
  };

  const logs = await provider.getLogs(filter);
  let TransactionData = [];
  for (let i = 0; i < logs.length; i++) {
    const stakerAddress = "0x" + logs[i].topics[1].slice(26);
    const amount = ethers.BigNumber.from(logs[i].data).toString();
    let timestamp = await getTransactionTimestamp(logs[i]);
    TransactionData.push({
      stakerAddress,
      amount,
      transactionHash: logs[i].transactionHash,
      timestamp: timestamp,
    });
  }

  await redisFunc.setString(
    chainId.toString() + "StakingTransaction",
    JSON.stringify(TransactionData)
  );

  return TransactionData;
}




getLogs(10000);


module.exports={
  getLogs
}