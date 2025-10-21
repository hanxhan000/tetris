// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF6B6B', // I - 红色
    '#4ECDC4', // J - 青色
    '#FFE66D', // L - 黄色
    '#6A0572', // O - 紫色
    '#1A535C', // S - 深绿
    '#FF9F1C', // T - 橙色
    '#2EC4B6'  // Z - 蓝绿色
];

// 方块形状
const SHAPES = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 游戏变量
let canvas = document.getElementById('board');
let nextPieceCanvas = document.getElementById('next-piece');
let nextPieceTopCanvas = document.getElementById('next-piece-top');
let ctx = canvas.getContext('2d');
let nextPieceCtx = nextPieceCanvas ? nextPieceCanvas.getContext('2d') : null;
let nextPieceTopCtx = nextPieceTopCanvas ? nextPieceTopCanvas.getContext('2d') : null;
let board = createMatrix(COLS, ROWS);
let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    level: 1,
    lines: 0,
    nextPiece: null
};
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameActive = false;
let gameAnimation = null;
let gameOverCallback = null;
let dropStart = 0; // 用于加速下落功能

// 初始化画布
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
if (nextPieceCtx) nextPieceCtx.scale(BLOCK_SIZE/2, BLOCK_SIZE/2);
if (nextPieceTopCtx) nextPieceTopCtx.scale(BLOCK_SIZE/2, BLOCK_SIZE/2);

// 创建矩阵
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// 创建随机方块
function createPiece() {
    const piece = Math.floor(Math.random() * 7) + 1;
    return SHAPES[piece];
}

// 绘制方块
function drawMatrix(matrix, offset, context = ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                
                // 绘制方块主体
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // 添加方块边框效果
                context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                
                // 添加方块高光效果
                context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                context.fillRect(x + offset.x, y + offset.y, 0.2, 0.2);
            }
        });
    });
}

// 绘制下一个方块
function drawNextPiece() {
    if (nextPieceCtx) {
        nextPieceCtx.fillStyle = '#f8f9fa';
        nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    }
    if (nextPieceTopCtx) {
        nextPieceTopCtx.fillStyle = '#f8f9fa';
        nextPieceTopCtx.fillRect(0, 0, nextPieceTopCanvas.width, nextPieceTopCanvas.height);
    }
    
    if (player.nextPiece) {
        const offsetX = (6 - player.nextPiece[0].length) / 2;
        const offsetY = (6 - player.nextPiece.length) / 2;
        if (nextPieceCtx) drawMatrix(player.nextPiece, { x: offsetX, y: offsetY }, nextPieceCtx);
        if (nextPieceTopCtx) drawMatrix(player.nextPiece, { x: offsetX, y: offsetY }, nextPieceTopCtx);
    }
}

// 绘制游戏板
function drawBoard() {
    // 绘制背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 0.02;
    
    // 垂直线
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ROWS);
        ctx.stroke();
    }
    
    // 水平线
    for (let j = 0; j <= ROWS; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(COLS, j);
        ctx.stroke();
    }
    
    // 绘制已放置的方块
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x, y, 1, 1);
                
                // 添加方块边框效果
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x, y, 1, 1);
                
                // 添加方块高光效果
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(x, y, 0.2, 0.2);
            }
        });
    });
}

// 绘制游戏
function draw() {
    drawBoard();
    drawMatrix(player.matrix, player.pos);
}

// 检查碰撞
function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 旋转方块
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 旋转玩家方块
function playerRotate(dir) {
    if (!gameActive) return;
    
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 玩家移动
function playerMove(dir) {
    if (!gameActive) return;
    
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

// 玩家下落
function playerDrop() {
    if (!gameActive) return;
    
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        sweepRows();
        updateScore();
    }
    dropCounter = 0;
}

// 瞬间下落
function playerHardDrop() {
    if (!gameActive) return;
    
    while (!collide(board, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
}

// 设置加速下落标志
function startSoftDrop() {
    if (!gameActive) return;
    dropStart = performance.now();
}

// 停止加速下落
function endSoftDrop() {
    dropStart = 0;
}

// 合并方块到游戏板
function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 重置玩家
function playerReset() {
    // 设置下一个方块为当前方块
    player.matrix = player.nextPiece || createPiece();
    player.nextPiece = createPiece();
    drawNextPiece();
    
    // 重置位置
    player.pos.y = 0;
    player.pos.x = Math.floor((board[0].length - player.matrix[0].length) / 2);
    
    // 游戏结束检查
    if (collide(board, player)) {
        gameOver();
    }
}

// 清除完整行
function sweepRows() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        rowCount++;
    }
    
    // 更新消除行数和等级
    if (rowCount > 0) {
        player.lines += rowCount;
        player.level = Math.floor(player.lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100); // 增加速度，但不低于100ms
        
        // 根据消除行数计算得分
        switch (rowCount) {
            case 1:
                player.score += 40 * player.level;
                break;
            case 2:
                player.score += 100 * player.level;
                break;
            case 3:
                player.score += 300 * player.level;
                break;
            case 4:
                player.score += 1200 * player.level;
                break;
        }
        
        updateScore();
    }
}

// 更新得分显示
function updateScore() {
    if (typeof updateUIData === 'function') {
        updateUIData({
            score: player.score,
            level: player.level,
            lines: player.lines
        });
    }
}

// 游戏结束
function gameOver() {
    gameActive = false;
    cancelAnimationFrame(gameAnimation);
    
    if (gameOverCallback) {
        gameOverCallback(player.score);
    }
}

// 游戏循环
function update(time = 0) {
    if (!gameActive) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    
    // 处理加速下落
    if (dropStart > 0) {
        const softDropTime = time - dropStart;
        // 每50毫秒下落一次（比正常速度更快）
        if (softDropTime > 50) {
            playerDrop();
            dropStart = time;
        }
    } 
    // 正常下落速度
    else if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    gameAnimation = requestAnimationFrame(update);
}

// 初始化游戏
function init() {
    board = createMatrix(COLS, ROWS);
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    player.nextPiece = createPiece();
    playerReset();
    updateScore();
    draw();
    drawNextPiece();
}

// 开始游戏
function startGame() {
    if (!gameActive) {
        gameActive = true;
        lastTime = performance.now();
        update();
    }
}

// 暂停游戏
function pauseGame() {
    if (gameActive) {
        gameActive = false;
        cancelAnimationFrame(gameAnimation);
    }
}

// 重置游戏
function resetGame() {
    gameActive = false;
    cancelAnimationFrame(gameAnimation);
    init();
}

// 设置游戏结束回调
function setGameOverCallback(callback) {
    gameOverCallback = callback;
}

// 导出函数供UI使用
window.TetrisGame = {
    init,
    startGame,
    pauseGame,
    resetGame,
    playerMove,
    playerRotate,
    playerHardDrop,
    startSoftDrop,
    endSoftDrop,
    setGameOverCallback
};