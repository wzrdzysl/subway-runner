// 游戏主循环和状态管理
class Game {
    constructor() {
        this.scene = null;
        this.player = null;
        this.track = null;
        this.obstacles = null;
        this.coins = null;
        this.input = null;
        this.ui = null;

        this.state = 'MENU'; // MENU | PLAYING | GAME_OVER
        this.gameSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.score = 0;
        this.collectedCoins = 0;
        this.elapsedTime = 0;

        this.lastTime = 0;
        this.animFrameId = null;
    }

    init() {
        // 预加载音频（不等用户点击，提前加载BGM大文件）
        audioManager.init();

        // 初始化子系统
        this.input = new InputManager();
        this.ui = new UIManager();

        const gameScene = new GameScene();
        gameScene.init(document.getElementById('game-container'));
        this.scene = gameScene.getScene();
        this.camera = gameScene.getCamera();
        this.renderer = gameScene.getRenderer();
        this._gameScene = gameScene;

        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.obstacles = new ObstacleManager(this.scene);
        this.coins = new CoinManager(this.scene);

        // 绑定按钮事件
        this.ui.getStartButton().addEventListener('click', () => this.startGame());
        this.ui.getRestartButton().addEventListener('click', () => this.startGame());

        // 空格键也可以开始
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' && this.state === 'MENU') {
                e.preventDefault();
                this.startGame();
            }
        });

        // 点击开始界面也可以开始
        this.ui.startScreen.addEventListener('click', (e) => {
            if (e.target === this.ui.startScreen) {
                this.startGame();
            }
        });

        this.ui.showStartScreen();

        // 启动渲染循环
        this.lastTime = performance.now();
        this._loop = this._loop.bind(this);
        this.animFrameId = requestAnimationFrame(this._loop);
    }

    startGame() {
        // 初始化音频（需要用户交互）
        audioManager.init();
        audioManager.playBGM();

        // 重置状态
        this.gameSpeed = GAME_CONFIG.INITIAL_SPEED;
        this.score = 0;
        this.collectedCoins = 0;
        this.elapsedTime = 0;

        this.player.reset();
        this.obstacles.reset();
        this.coins.reset();

        this.ui.hideStartScreen();
        this.ui.hideGameOver();
        this.ui.updateScore(0);
        this.ui.updateCoins(0);

        this.state = 'PLAYING';
    }

    gameOver(reason) {
        if (this.state !== 'PLAYING') return;

        this.state = 'GAME_OVER';
        audioManager.stopBGM();
        audioManager.playDeath();

        this.player.playDeathAnimation();

        // 雪碧冲上来撞飞玩家
        this.obstacles.triggerCatch(this.player.getPosition(), this.player.mesh);

        // 延迟弹出游戏结束面板，先让撞击动画播完
        setTimeout(() => {
            this.ui.showGameOver(Math.floor(this.score), this.collectedCoins);
        }, 1500);
    }

    _loop(timestamp) {
        this.animFrameId = requestAnimationFrame(this._loop);

        const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1); // 防止大帧跳跃
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this._update(delta);
        } else if (this.state === 'GAME_OVER') {
            // 继续渲染死亡动画
            this.obstacles.updateCatchAnimation(delta);
        }

        this._render();
    }

    _update(delta) {
        // 增加游戏速度
        this.gameSpeed = Math.min(
            GAME_CONFIG.MAX_SPEED,
            this.gameSpeed + GAME_CONFIG.SPEED_INCREMENT
        );

        // 更新分数
        this.score += this.gameSpeed * 10;
        this.ui.updateScore(this.score);

        // 更新玩家
        this.player.update(delta, this.input, this.gameSpeed);

        // 更新轨道
        this.track.update(this.gameSpeed);

        // 更新障碍物和雪碧追击者（纯视觉跟随）
        this.obstacles.update(
            delta, this.gameSpeed,
            this.player.getLane(),
            this.player.getPosition()
        );

        // 碰撞检测
        const playerPos = this.player.getPosition();
        if (this.obstacles.checkCollision(playerPos, this.player.isJumping, this.player.isSliding)) {
            this.gameOver('obstacle');
            return;
        }

        // 更新收集物
        this.coins.update(delta, this.gameSpeed, playerPos);

        // 收集检测
        const collected = this.coins.checkCollection(playerPos, this.player.isSliding);
        if (collected > 0) {
            this.collectedCoins += Math.floor(collected / GAME_CONFIG.COIN_VALUE);
            this.ui.updateCoins(this.collectedCoins);
        }

        // Billboarding
        this.player.updateBillboard(this.camera);
        this.coins.updateBillboard(this.camera);
    }

    _render() {
        this._gameScene.render();
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
