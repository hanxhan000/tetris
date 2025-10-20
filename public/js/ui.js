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

// 从服务器获取排行榜
async function fetchLeaderboard() {
    try {
        // 在实际开发中，这里会从服务器获取数据
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        // 模拟数据
        /*
        const mockData = [
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
        */
        
        updateLeaderboard(data);
    } catch (error) {
        console.error('获取排行榜失败:', error);
        updateLeaderboard([]);
    }
}

// 提交得分到服务器
async function submitScore(name, score) {
    try {
        // 在实际开发中，这里会向服务器提交数据
        const response = await fetch('/api/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, score })
        });
        
        const result = await response.json();
        
        /*
        // 模拟提交成功
        console.log(`提交得分: ${name} - ${score}`);
        */
        fetchLeaderboard(); // 重新获取排行榜
        return result.success;
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
    
    // 移动端长按屏幕加速下落功能
    let touchStartY = 0;
    let isSoftDropping = false;
    let touchTimer = null;
    
    // 在游戏区域添加触摸事件监听器
    const gameBoard = document.getElementById('board');
    
    gameBoard.addEventListener('touchstart', (e) => {
        // 防止页面滚动
        e.preventDefault();
        
        // 记录触摸开始位置
        if (e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
        }
        
        // 设置定时器，长按触发软降
        touchTimer = setTimeout(() => {
            if (!isSoftDropping) {
                isSoftDropping = true;
                window.TetrisGame.startSoftDrop();
            }
        }, 200); // 200ms长按触发
    }, { passive: false });
    
    gameBoard.addEventListener('touchend', (e) => {
        // 清除定时器
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        
        // 停止软降
        if (isSoftDropping) {
            isSoftDropping = false;
            window.TetrisGame.endSoftDrop();
        }
    });
    
    gameBoard.addEventListener('touchmove', (e) => {
        // 如果在软降过程中移动超过一定距离，则取消软降
        if (isSoftDropping && e.touches.length > 0) {
            const touchY = e.touches[0].clientY;
            const deltaY = Math.abs(touchY - touchStartY);
            if (deltaY > 20) { // 移动超过20像素则取消软降
                isSoftDropping = false;
                if (touchTimer) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
                window.TetrisGame.endSoftDrop();
            }
        }
        
        // 如果有定时器，移动时清除它以防止误触发
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }, { passive: false });
    
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