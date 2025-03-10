const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gameProgressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    gameName: {
        type: String,
        required: true,
    },
    score: { 
        type: Number, 
        default: 0 
    },
    lastPlayed: { 
        type: Date, 
        default: Date.now,
    }
});

module.exports = mongoose.model("GameProgress", gameProgressSchema);
