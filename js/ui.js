// UI模块
let leaderboardData = [];

// 云端排行榜配置（如需更换为你的云端API，请修改下方URL）
const LEADERBOARD_URL = 'https://hanxhan000.github.io/tetris/leaderboard.json';
const LEADERBOARD_SUBMIT_URL = ''; // 若有提交API，请填入；为空时不写云端

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

// 从云端获取排行榜（失败则回退到本地存储，不写入默认数据）
async function fetchLeaderboard() {
    try {
        const res = await fetch(LEADERBOARD_URL + '?t=' + Date.now(), { cache: 'no-store', mode: 'cors' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const leaderboard = await res.json();
        updateLeaderboard(Array.isArray(leaderboard) ? leaderboard.slice(0, 10) : []);
    } catch (error) {
        console.warn('云端排行榜获取失败，回退至本地:', error);
        const leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        updateLeaderboard(leaderboard);
    }
}

// 提交得分到本地存储
async function submitScore(name, score) {
    try {
        if (LEADERBOARD_SUBMIT_URL) {
            const res = await fetch(LEADERBOARD_SUBMIT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score }),
            });
            if (!res.ok) throw new Error('提交失败: HTTP ' + res.status);
        } else {
            // 无提交API时，保存到本地以便页面内展示，不触及云端数据
            let leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
            leaderboard.push({ name, score });
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 10);
            localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
        }
        // 刷新榜单显示（优先云端）
        fetchLeaderboard();
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

    // 获取排行榜（云端优先，不再创建默认数据）
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
    // 统一触摸逻辑：长按触发加速，下滑/松手结束；允许页面滚动
    const gameBoard = document.getElementById('board');
    let longPressTimer = null;
    let longPressActive = false;
    
    gameBoard.addEventListener('touchstart', () => {
        longPressActive = true;
        // 250ms 长按后开始软降
        longPressTimer = setTimeout(() => {
            if (longPressActive && window.TetrisGame && typeof window.TetrisGame.startSoftDrop === 'function') {
                window.TetrisGame.startSoftDrop();
            }
        }, 250);
    }, { passive: true });
    
    gameBoard.addEventListener('touchmove', () => {
        // 移动时取消长按计时器，避免误触发
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        // 不阻止默认，让页面可以滚动
    }, { passive: true });
    
    gameBoard.addEventListener('touchend', () => {
        longPressActive = false;
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (window.TetrisGame && typeof window.TetrisGame.endSoftDrop === 'function') {
            window.TetrisGame.endSoftDrop();
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