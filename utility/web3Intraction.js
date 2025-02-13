const { Contract, ethers } = require("ethers");

///helpers

const CONST = require("../config/constant.json");

//ABI
const TokenABI = require("./ABI/TokenABI.json");
const UniswapV3Staker = require("./ABI/UniswapV3Staker.json");
const NFTManager = require("./ABI/NonfungiblePositionManager.json");
const PancakeV3Pool = require("./ABI/PancakeV3Pool.json");
const UniswapV3Factory = require("./ABI/UniswapV3Factory.json");
const StakingABI = require("./ABI/StakingABI.json");
const { toFixedCustm } = require("../helpers/common");

function createFallbackProvider(rpcUrls) {
  const providers = rpcUrls
    .map((url) => {
      try {
        const provider = new ethers.getDefaultProvider(url);
        // console.log(provider, "<====provider")

        return provider;
      } catch (error) {
        console.log(error, "<====error in provider");

        return null;
      }
    })
    .filter((provider) => provider !== null);
  // console.log(providers, "<====providers")
  if (providers.length === 0) {
    throw new Error("No valid providers were created.");
  }

  return providers[0];
}

class Web3Intraction {

  constructor(chainId, anotherRpc) {
    this.PROVIDER = createFallbackProvider(anotherRpc ? [anotherRpc] : CONST.rpcUrls[chainId || 10000]);
    this.SIGNER = new ethers.Wallet(process.env.PVT_KEY, this.PROVIDER);
    this.contractDetails = {
      abi: UniswapV3Staker,
      ...CONST.contract[chainId || 10000],
    };
  }


  /**
   * Get contract from abi and address
   *
   * @param {string} abi - ABI JSON
   * @param {string} address - Contract Address
   * @param {boolean} isSigner - signer ot not
   *
   * @returns {object} Contract
   */
  getContract = (abi, address) => {
    try {
      let contract = new Contract(address, JSON.parse(abi), this.PROVIDER);
      return contract;
    } catch (error) {
      console.log("error", error);
      return null;
    }
  };

  getContractInstance = (abi, address) => {
    try {
      let contract = new Contract(address, JSON.parse(abi), this.SIGNER);
      return contract;
    } catch (error) {
      console.log("error", error);
      return null;
    }
  };

  getTransaction = async(txHash) => {
    try {
      const tx = await this.PROVIDER.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.log("error", error);
      return null;
    }
  };


  /**
   * Get Deposit in Incentive
   *
   * @param {string} tokenId token id
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   **/
  getDeposit = async (tokenId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );

        let deposit = await contract.deposits(tokenId);

        resolve(deposit);
      } catch (error) {
        // console.log(error, "<===error in buy");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get stakes in Incentive
   *
   * @param {string} tokenId token id
   * @param {string} incentiveId incentive id
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getStakes = async (tokenId, incentiveId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );

        let stakes = await contract.stakes(tokenId, incentiveId);

        resolve({
          liquidity: stakes.liquidity.toString(),
          secondsPerLiquidityInsideInitialX128:
            stakes.secondsPerLiquidityInsideInitialX128.toString(),
        });
      } catch (error) {
        console.log(error, "<===error in getStakes");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get Rewards in Incentive
   * @param {array} keys [reward token, pool address,start time, endTime, refundee address]
   * @param {string} tokenId token id
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getRewardInfo = async (keys, tokenId) => {
    try {
      let contract = this.getContract(
        JSON.stringify(this.contractDetails?.abi),
        this.contractDetails?.v3StakingContractAddress,
        true
      );
      let rewards = await contract.getRewardInfo(keys, tokenId);
      return rewards;
    } catch (error) {
      return null;
    }
  };


  /**
   * Get Rewards in Incentive
   * @param {array} rewardToken rewardToken
   * @param {string} walletAddress token id
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getRewards = async (rewardToken, walletAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );

        let rewards = await contract.rewards(rewardToken, walletAddress);

        resolve(rewards);
      } catch (error) {
        // console.log(error, "<===error in buy");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get Nft Token Id
   * @param {string} walletAddress own wallet address
   * @param {string} index index
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getTokenId = async (walletAddress, index) => {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = this.getContract(
          JSON.stringify(NFTManager),
          this.contractDetails?.nftManagerContractAddress,
          true
        );

        const response = await contract.tokenOfOwnerByIndex(
          walletAddress,
          index
        );

        resolve(response.toString());
      } catch (error) {
        // console.log(error, "<===error in getTokenId");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get Nft Token Id
   * @param {string} walletAddress own wallet address
   * @param {string} index index
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getTokenLiquidity = async (tokenId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = this.getContract(
          JSON.stringify(NFTManager),
          this.contractDetails?.nftManagerContractAddress,
          true
        );

        const response = await contract.positions(tokenId);



        resolve(response.liquidity.toString());
      } catch (error) {
        // console.log(error, "<===error in getTokenId");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get Nft Token URI
   * @param {string} tokenId own wallet address
   *
   * @returns {Promise} base64 encoded in Success or Error in Fail
   */
  getTokenURI = async (tokenId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = this.getContract(
          JSON.stringify(NFTManager),
          this.contractDetails?.nftManagerContractAddress,
          true
        );

        const response = await contract.tokenURI(tokenId);

        // console.log(response, "<===response")

        resolve(response);
      } catch (error) {
        // console.log(error, "<===error in buy");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  getTokenDecimal = async (tokenAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (tokenAddress) {
          let tokenContract = await this.getContract(
            JSON.stringify(TokenABI),
            tokenAddress,
            true
          );

          let tokenDecimal = await tokenContract.decimals();
          let tokenSymbol = await tokenContract.symbol();

          resolve({
            decimal: tokenDecimal,
            symbol: tokenSymbol,
          });
        }
      } catch (error) {
        console.log(error, "<====err in getTokenDecimal");
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  nftCount = async (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );
        let res = await contract.incentives(id);
        resolve(res);
      } catch (error) {
        // console.log(error, "<===error in buy");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   *
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getPoolDetails = async (poolAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(PancakeV3Pool),
          poolAddress,
          true
        );
        let getToken0Address = await contract.token0();
        let getToken1Address = await contract.token1();
        let getToken0Detail = await this.getTokenSymbolAndDecimal(
          getToken0Address
        );
        let getToken1Detail = await this.getTokenSymbolAndDecimal(
          getToken1Address
        );
        resolve({
          token0Symbol: getToken0Detail.symbol,
          token1Symbol: getToken1Detail.symbol,
        });
      } catch (error) {
        console.log(error, "<===error in getPoolSymbol");

        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };


  /**
   * Get NFT 
   *
   * @param {string} tokenId token id

   *
   *
   * @returns {Promise} address APR in Success or Error in Fail
   */
  getNftPoolAddress = async (tokenId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const NftContract = this.getContract(
          JSON.stringify(NFTManager),
          this.contractDetails?.nftManagerContractAddress,
          true
        );
        let factoryAddress = await NftContract.factory();

        let positions = await NftContract.positions(tokenId);
        const facoryContract = this.getContract(
          JSON.stringify(UniswapV3Factory),
          factoryAddress,
          true
        );
        const getPool = await facoryContract.getPool(
          positions.token0,
          positions.token1,
          positions.fee
        );
        // console.log(apr, "<===apr")

        resolve(getPool);
      } catch (error) {
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

  /**
   * Get stakes in Incentive
   *
   * @param {string} tokenId token id
   * @param {string} incentiveId incentive id
   *
   * @returns {Promise} Object (Transaction Hash, Contract Address) in Success or Error in Fail
   */
  getGobStakes = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(StakingABI),
          this.contractDetails?.stakingContractAddress,
          true
        );

        let totalSupply = await contract.totalSupply();

        totalSupply = totalSupply.toString() / 10 ** 9;
        resolve(totalSupply);
      } catch (error) {
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

  getAPR = async (totalSupply, rewardTokenPrice, GOBPrice) => {
    return new Promise(async (resolve, reject) => {
      try {
        rewardTokenPrice = Number(rewardTokenPrice);
        GOBPrice = Number(GOBPrice);

        let contract = this.getContract(
          JSON.stringify(StakingABI),
          this.contractDetails?.stakingContractAddress,
          true
        );
        let rewardsToken = await contract.rewardsToken();
        let getTokenData = await this.getTokenSymbolAndDecimal(rewardsToken);
        let rewardRate = await contract.rewardRate();
        rewardRate = rewardRate.toString() / 10 ** getTokenData.tokenDecimal;
        rewardRate = toFixedCustm(rewardRate);
        const secondsInAYear = 365 * 24 * 60 * 60;

        const apr = 
          ((rewardRate * rewardTokenPrice * secondsInAYear) /
            (totalSupply * GOBPrice)) *
          100;

        resolve(apr > 1 ? Number(apr).toFixed(2) : Number(apr).toFixed(4));
      } catch (error) {
        console.log(error)
        reject(0);
      }
    });
  };

  getTokenSymbolAndDecimal = async (tokenAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        let tokenContract = this.getContract(
          JSON.stringify(TokenABI),
          tokenAddress,
          true
        );

        let tokenDecimal = await tokenContract.decimals();
        let symbol = await tokenContract.symbol();

        resolve({ tokenDecimal: tokenDecimal, symbol: symbol });
      } catch (error) {
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

  checkAllowance = async (tokenAmount, tokenAddress, approvalAddress) => {
    return new Promise(async (resolve, reject) => {
      let tokenAmountWithDecimal = 0;
      try {
        let walletAddres = this.SIGNER.getAddress();
        if (tokenAddress && approvalAddress) {
          let tokenContract = this.getContractInstance(
            JSON.stringify(TokenABI),
            tokenAddress,
            true
          );

          let getBalance = await tokenContract.balanceOf(walletAddres);
          let tokenDecimal = await tokenContract.decimals();

          getBalance = getBalance.toString() / 10 ** tokenDecimal;
          if (Number(tokenAmount) > Number(getBalance)) {
            return reject("Don't have enough token");
          }

          let tokenAllowence = await tokenContract.allowance(
            walletAddres,
            approvalAddress
          );

          let getTotalSupply = await tokenContract.totalSupply();
          let getTotalSupplyInEth =
            getTotalSupply.toString() / 10 ** tokenDecimal;
          if (Number(tokenAmount) > Number(getTotalSupplyInEth)) {
            return reject("Don't have enough supply in pool");
          }

          // tokenAmount = parseInt(tokenAmount);
          tokenAllowence = tokenAllowence.toString();

          if (tokenDecimal == 18) {
            tokenAmountWithDecimal = ethers.utils.parseUnits(
              tokenAmount.toString(),
              "ether"
            );
          } else {
            tokenAmountWithDecimal = Number(tokenAmount) * 10 ** tokenDecimal;
          }
          tokenAmountWithDecimal = toFixedCustm(parseInt(tokenAmountWithDecimal));

          if (Number(tokenAmountWithDecimal) > tokenAllowence) {
            const txn = await tokenContract.approve(
              approvalAddress,
              tokenAmountWithDecimal.toString()
            );
            await txn.wait();
          }
          setTimeout(() => {
            resolve(tokenAmountWithDecimal);
          }, 5000)
        }
      } catch (error) {
        if (error?.code === -32000) {
          setTimeout(() => {
            resolve(tokenAmountWithDecimal);
          }, 5000)
          return
        }
        console.log(error, "<====err in allowance");
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

  endIncentive = async (keys, tokenIds) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContract(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );
        let encodeData = [];

        for (let i = 0; i < tokenIds.length; i++) {
          let unstakeToken = await contract.interface.encodeFunctionData(
            "unstakeToken",
            [keys, tokenIds[i]]
          );
          encodeData.push(unstakeToken);
        }

        let endIncentive = await contract.interface.encodeFunctionData(
          "endIncentive",
          [keys]
        );

        encodeData.push(endIncentive);

        // Encode the function calls

        const multicallData = contract.interface.encodeFunctionData(
          "multicall",
          [encodeData]
        );

        const tx = {
          to: this.contractDetails?.v3StakingContractAddress,
          data: multicallData,
          value: ethers.utils.parseEther("0"), // Amount of Ether to send with the transaction
          gasLimit: ethers.BigNumber.from("1000000"),
        };

        const response = await this.SIGNER.sendTransaction(tx);

        let receipt = await response.wait(); // Wait for the transaction to be mined

        resolve(receipt);
      } catch (error) {
        // console.log(error, "<===error in buy");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        if (error?.code === -32000) {

          setTimeout(() => {
            resolve(true)
          }, 5000)
          return;
        }
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

  createIncentive = async (keys, rewards, minimumWidth, tokenAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        let contract = this.getContractInstance(
          JSON.stringify(this.contractDetails?.abi),
          this.contractDetails?.v3StakingContractAddress,
          true
        );

        let tx;
        if (!tokenAddress) {
          return reject("Token Address not found!");
        }
        let rewardTokenAmount = await this.checkAllowance(
          rewards,
          tokenAddress,
          this.contractDetails?.v3StakingContractAddress
        );

        tx = await contract.createIncentive(
          keys,
          rewardTokenAmount.toString(),
          minimumWidth,
        );
        let receipt = await tx.wait();
        resolve(receipt);
      } catch (error) {
        console.log(error, "<===error in createIncentive");
        if (error?.code === -32603) {
          return reject("insufficient funds for intrinsic transaction cost");
        }

        if (error?.code === -32000) {

          setTimeout(() => {
            resolve(true)
          }, 5000)
          return;
        }
        reject(error.reason || error.data?.message || error.message || error);
      }
    });
  };

}

module.exports = Web3Intraction;
