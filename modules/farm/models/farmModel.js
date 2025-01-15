const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  chainId: { type: Number, required: true },
  incentiveId: { type: String, required: true },
  apr: { type: String },
  tvl: { type: String },
  feeTier: { type: Number, required: true },
  getPoolDetail: {
    token0Symbol: { type: String, required: true },
    token0Address: { type: String, required: true },
    token1Symbol: { type: String, required: true },
    token1Address: { type: String, required: true },
  },
  minWidth: { type: Number },
  nftCount: { type: Number },
  reward: { type: Number, required: true },
  rewardSymbol: { type: String, required: true },
  rewardToken: { type: String, required: true },
  rewardDecimal: { type: Number, required: true },
  pool: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  refundee: { type: String, required: true },
  isUnstaked: { type: Boolean, default: false },
},
  { timestamps: true }
);

const Farm = mongoose.model('farms', farmSchema);

module.exports = Farm;
