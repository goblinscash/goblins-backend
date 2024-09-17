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

async function getUnStakeLogs(chainId) {
  const filter = {
    fromBlock: 0, // Starting block (replace with actual deployment block if known)
    toBlock: "latest", // Latest block
    address: contractAddress, // Contract address to track
    topics: [
      "0x7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5",
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
    chainId.toString() + "UnStakingTransaction",
    JSON.stringify(TransactionData)
  );

  return TransactionData;
}






module.exports={
  getUnStakeLogs
}