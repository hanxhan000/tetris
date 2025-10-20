const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// 获取排行榜 (Top 10)
router.get('/leaderboard', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10)
            .select('name score');
        
        res.json(scores);
    } catch (error) {
        console.error('获取排行榜失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 提交得分
router.post('/score', async (req, res) => {
    try {
        const { name, score } = req.body;
        
        // 验证数据
        if (!name || typeof score !== 'number' || score < 0) {
            return res.status(400).json({ error: '无效的数据' });
        }
        
        // 创建新得分记录
        const newScore = new Score({
            name: name.substring(0, 15), // 限制名字长度
            score: Math.floor(score)
        });
        
        // 保存到数据库
        await newScore.save();
        
        res.json({ success: true, message: '得分提交成功' });
    } catch (error) {
        console.error('提交得分失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;