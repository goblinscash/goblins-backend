const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
    farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    chainId: { type: Number, required: true },
    wallet: { type: String, required: true },
    tokenId: { type: String, required: true },
    isUnstaked: { type: Boolean, default: false },
    reward: { type: Number },
    tokenDecimal: { type: Number }
},
    { timestamps: true }
)

const Deposit = mongoose.model("deposit", depositSchema)

module.exports = Deposit;