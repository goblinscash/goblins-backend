const Web3Intraction = require("../utility/web3Intraction");

const loadWalletTokenIds = async (chainId, walletAddress) => {
  let tokens = [];
  const web3 = new Web3Intraction(chainId);

  for (let i = 0; i < 1000; i++) {
    try {
      let tokenId = await web3.getTokenId(walletAddress, i);
      if (chainId === 10000) {
        let tokenURI = await web3.getTokenURI(tokenId);
        let base64String = tokenURI.replace(
          /^data:application\/json;base64,/,
          ""
        );

        const decodedStr = Buffer.from(base64String, "base64").toString(
          "utf-8"
        );
        const decodedData = JSON.parse(decodedStr);
        tokens.push({
          ...decodedData,
          value: tokenId,
          label: decodedData.name,
        });
      } else {
        tokens.push({
          image: "/dfd.jpg",
          value: tokenId,
          label: tokenId,
        });
      }
    } catch (error) {
      break;
    }
  }

  return tokens;
};

const loadContractTokenIds = async (chainId, walletAddress) => {
  let tokens = [];
  const web3 = new Web3Intraction(chainId);
  for (let i = 0; i < 10000; i++) {
    try {
      let tokenId = await web3.getTokenId(
        web3.contractDetails.v3StakingContractAddress,
        i
      );
      let desposit = await web3.getDeposit(tokenId);


      if (desposit.owner == walletAddress) {
        if (chainId == 10000) {
          let tokenURI = await web3.getTokenURI(tokenId);

          let base64String = tokenURI.replace(
            /^data:application\/json;base64,/,
            ""
          );

          const decodedStr = Buffer.from(base64String, "base64").toString(
            "utf-8"
          );
          const decodedData = JSON.parse(decodedStr);
          tokens.push({
            ...decodedData,
            value: tokenId,
            label: decodedData.name,
          });
        } else {
          tokens.push({
            image: "/dfd.jpg",
            value: tokenId,
            label: tokenId,
          });
        }
      }
    } catch (error) {
      break;
    }
  }

  return tokens;
};

module.exports = {
  loadWalletTokenIds,
  loadContractTokenIds,
};
