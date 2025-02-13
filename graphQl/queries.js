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

const tokenUSDPriceQuery = `
query ($id: String!) {
  token(id: $id){
    id,
    name,
    volumeUSD,
    totalValueLocked,
    tokenDayData(orderBy: date, orderDirection: desc){
      open
      date
    }    
  }
}
`;

const tokenStakedQuery = `
query($timestamp: BigInt!) {
  tokenStakeds(
    orderBy: blockTimestamp
    orderDirection: desc
    first: 100
    where: { blockTimestamp_gte: $timestamp }
  ) {
    incentiveId
    tokenId
    blockTimestamp
    transactionHash
  }
}
`;

const tokenUnstakedQuery = `
query($timestamp: BigInt!) {
  tokenUnstakeds(
    orderBy: blockTimestamp
    orderDirection: desc
    first: 100
    where: { blockTimestamp_gte: $timestamp }
  ) {
    incentiveId
    tokenId
    blockTimestamp
    transactionHash
  }
}
`;



module.exports = {
  getAllDataQuery,
  getMyFarmQuery,
  getPoolDetailQuery,
  tokenUSDPriceQuery,
  tokenStakedQuery,
  tokenUnstakedQuery
};
