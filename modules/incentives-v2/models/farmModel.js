const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  apr: { type: String, required: true },
  tvl: { type: String, required: true },
  incentiveId: { type: String, required: true },
  feeTier: { type: Number, required: true },
  getPoolDetail: {
    token0Symbol: { type: String, required: true },
    token0Address: { type: String, required: true },
    token1Symbol: { type: String, required: true },
    token1Address: { type: String, required: true },
  },
  minWidth: { type: Number, required: true },
  nftCount: { type: String, required: true },
  id: { type: String, required: true },
  reward: { type: Number, required: true },
  rewardSymbol: { type: String, required: true },
  isEnded: { type: Boolean, required: true },
  key: {
    rewardToken: { type: String, required: true },
    pool: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    refundee: { type: String, required: true },
  },
});

const Incentive = mongoose.model('Incentive', incentiveSchema);

module.exports = Incentive;
