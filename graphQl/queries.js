let getAllDataQuery = `query {
    incentiveCreateds(orderBy: endTime, orderDirection: desc) {
     id
     rewardToken
     pool
     startTime
     endTime
     refundee
     reward
     minWidth
     transactionHash
    },
    incentiveEndeds(first: 1000){
      incentiveId
    },
  
 }`;

let getMyFarmQuery = `query {
    incentiveCreateds(orderBy: endTime, orderDirection: desc) {
      id
      rewardToken
      pool
      startTime
      endTime
      refundee
      reward
    },
    tokenStakeds(first:1000, orderBy: blockTimestamp, orderDirection: desc) {
     tokenId
   }

  }`;

const getPoolDetailQuery = `
  query ($id: String!) {
    pool(id: $id) {
      id
      token0 {
        id
        decimals
        name
        symbol
      }
      token1 {
        id
        decimals
        name
        symbol
      }
      liquidity
      token0Price
      token1Price
      sqrtPrice
      feeTier
      volumeToken0
      volumeToken1
      totalValueLockedUSD
    }
  }
`;

module.exports = {
  getAllDataQuery,
  getMyFarmQuery,
  getPoolDetailQuery,
};
