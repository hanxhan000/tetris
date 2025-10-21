// UI模块
let leaderboardData = [];

// 更新UI数据
function updateUIData(data) {
    document.getElementById('score').textContent = data.score;
    document.getElementById('level').textContent = data.level;
    document.getElementById('lines').textContent = data.lines;
}

// 更新排行榜
function updateLeaderboard(data) {
    leaderboardData = data;
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    if (data.length === 0) {
        const li = document.createElement('li');
        li.textContent = '暂无数据';
        leaderboardList.appendChild(li);
        return;
    }
    
    data.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}</span>`;
        leaderboardList.appendChild(li);
    });
}

// 从本地存储获取排行榜
async function fetchLeaderboard() {
    try {
        // 从本地存储获取数据
        let leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        
        // 如果没有数据，使用默认数据
        if (leaderboard.length === 0) {
            leaderboard = [
                { name: "玩家A", score: 2500 },
                { name: "玩家B", score: 2100 },
                { name: "玩家C", score: 1800 },
                { name: "玩家D", score: 1500 },
                { name: "玩家E", score: 1200 },
                { name: "玩家F", score: 1000 },
                { name: "玩家G", score: 800 },
                { name: "玩家H", score: 600 },
                { name: "玩家I", score: 400 },
                { name: "玩家J", score: 200 }
            ];
            localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
        }
        
        updateLeaderboard(leaderboard);
    } catch (error) {
        console.error('获取排行榜失败:', error);
        updateLeaderboard([]);
    }
}

// 提交得分到本地存储
async function submitScore(name, score) {
    try {
        // 使用本地存储，因为GitHub Pages不支持后端API
        console.log(`提交得分: ${name} - ${score}`);
        
        // 获取现有排行榜
        let leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        
        // 添加新分数
        leaderboard.push({ name, score });
        
        // 按分数排序
        leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        leaderboard = leaderboard.slice(0, 10);
        
        // 保存到本地存储
        localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
        
        fetchLeaderboard(); // 重新获取排行榜
        return true;
    } catch (error) {
        console.error('提交得分失败:', error);
        return false;
    }
}

// 显示游戏结束模态框
function showGameOverModal(score) {
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-modal').classList.remove('hidden');
}

// 隐藏游戏结束模态框
function hideGameOverModal() {
    document.getElementById('game-over-modal').classList.add('hidden');
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    window.TetrisGame.init();
    window.TetrisGame.setGameOverCallback(showGameOverModal);
    
    // 获取排行榜
    fetchLeaderboard();
    
    // 键盘事件
    document.addEventListener('keydown', event => {
        switch (event.keyCode) {
            case 37: // 左箭头
                window.TetrisGame.playerMove(-1);
                event.preventDefault(); // 阻止默认行为
                break;
            case 39: // 右箭头
                window.TetrisGame.playerMove(1);
                event.preventDefault(); // 阻止默认行为
                break;
            case 40: // 下箭头
                // 开始软降（加速下落）
                window.TetrisGame.startSoftDrop();
                event.preventDefault(); // 阻止默认行为，防止页面滚动
                break;
            case 38: // 上箭头
                window.TetrisGame.playerRotate(1);
                event.preventDefault(); // 阻止默认行为
                break;
            case 32: // 空格
                window.TetrisGame.playerHardDrop();
                event.preventDefault(); // 阻止默认行为，防止页面滚动
                break;
        }
    });
    
    // 键盘释放事件
    document.addEventListener('keyup', event => {
        if (event.keyCode === 40) { // 下箭头释放
            // 停止软降
            window.TetrisGame.endSoftDrop();
        }
    });
    
    // 按钮事件
    document.getElementById('start-btn').addEventListener('click', () => {
        window.TetrisGame.startGame();
        document.getElementById('start-btn').textContent = '继续游戏';
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        window.TetrisGame.pauseGame();
    });
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        window.TetrisGame.resetGame();
        document.getElementById('start-btn').textContent = '开始游戏';
    });
    
    // 移动端按钮事件
    document.getElementById('rotate-btn').addEventListener('click', () => {
        window.TetrisGame.playerRotate(1);
    });
    
    document.getElementById('left-btn').addEventListener('click', () => {
        window.TetrisGame.playerMove(-1);
    });
    
    document.getElementById('right-btn').addEventListener('click', () => {
        window.TetrisGame.playerMove(1);
    });
    
    document.getElementById('drop-btn').addEventListener('click', () => {
        window.TetrisGame.playerHardDrop();
    });

    // 移动端开始按钮
    const startMobileBtn = document.getElementById('start-mobile-btn');
    if (startMobileBtn) {
        startMobileBtn.addEventListener('click', () => {
            window.TetrisGame.startGame();
            const startBtn = document.getElementById('start-btn');
            if (startBtn) startBtn.textContent = '继续游戏';
        });
    }
    
    // 移动端长按屏幕加速下落功能
    let touchStartY = 0;
    let isSoftDropping = false;
    let touchTimer = null;
    
    // 在游戏区域添加触摸事件监听器
    const gameBoard = document.getElementById('board');
    let touchTimer = null;
    let longPressActive = false;
    
    gameBoard.addEventListener('touchstart', (e) => {
        // 不再阻止默认滚动，让页面可下滑
        const touch = e.touches[0];
        longPressActive = true;
        touchTimer = setTimeout(() => {
            if (longPressActive && window.TetrisGame && typeof window.TetrisGame.softDrop === 'function') {
                window.TetrisGame.softDrop();
            }
        }, 300);
    }, { passive: true });
    
    gameBoard.addEventListener('touchmove', (e) => {
        // 滑动时取消长按计时器，允许页面滚动
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }, { passive: true });
    
    gameBoard.addEventListener('touchend', () => {
        longPressActive = false;
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }, { passive: true });
    
    // 模态框按钮事件
    document.getElementById('submit-score-btn').addEventListener('click', async () => {
        const name = document.getElementById('player-name').value.trim() || '匿名玩家';
        const score = parseInt(document.getElementById('final-score').textContent);
        
        const success = await submitScore(name, score);
        if (success) {
            hideGameOverModal();
            document.getElementById('player-name').value = '';
        } else {
            alert('提交失败，请重试');
        }
    });
    
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        hideGameOverModal();
    });
});

// 将更新UI数据的函数暴露给游戏模块
window.updateUIData = updateUIData;