const mongoose = require('mongoose');

// 定义得分模式
const scoreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 15
    },
    score: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引以提高查询性能
scoreSchema.index({ score: -1 });

// 创建模型
const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;