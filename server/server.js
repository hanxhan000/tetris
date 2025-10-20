const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api', scoreRoutes);

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});