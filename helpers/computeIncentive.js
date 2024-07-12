const {ethers} = require("ethers")

const computeABI = require("../utility/ABI/computeABi.json");

module.exports = {
  makeComputeData: async (key) => {
    return new Promise(async (resolve, reject) => {
      try {
        const provider = await new ethers.getDefaultProvider(
          "https://bsc-testnet-rpc.publicnode.com"
        );
        const contract = new ethers.Contract(
          "0xEA589fCCE1df1ee1ca5E1796A683408a36E6e267",
          computeABI,
          provider
        );

        let compute = await contract.compute(key);
        resolve(compute);
      } catch (err) {
        console.log(err, "<===err in makeComputeData");
        reject(err);
      }
    });
  },
};
