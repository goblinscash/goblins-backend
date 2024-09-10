const { ethers } = require("ethers");

// Replace with your WebSocket provider URL (e.g., Infura, Alchemy)
const wsProvider = new ethers.providers.WebSocketProvider("https://smartbch.greyh.at");

const contractAddress = "0xfA3D02c971F6D97076b8405500c2210476C6A5E8";
const topic = "0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d";

// Set up the filter
const filter = {
    address: contractAddress,
    topics: [topic],
};

// Listen for new logs
wsProvider.on(filter, (log) => {
    console.log("New Log:", log);
    
    // Process the log as needed
    // For example, you can decode the log data if you have the ABI
    // const parsedLog = yourContractInterface.parseLog(log);
    // console.log("Parsed Log:", parsedLog);
});

// Handle errors
wsProvider.on("error", (error) => {
    console.error("WebSocket error:", error);
});

// Handle disconnections
wsProvider.on("close", (code, reason) => {
    console.log(`WebSocket closed: ${code} ${reason}`);
});
