// UI / HUD 管理
class UIManager {
    constructor() {
        this.score = 0;
        this.coins = 0;
        this.highScore = parseInt(localStorage.getItem('subway_high_score') || '0');

        this._createElements();
    }

    _createElements() {
        // HUD容器
        this.hud = document.createElement('div');
        this.hud.id = 'game-hud';
        this.hud.innerHTML = `
            <div id="score-display">
                <div class="score-label">分数</div>
                <div class="score-value" id="score-value">0</div>
            </div>
            <div id="coin-display">
                <div class="coin-icon">🍦</div>
                <div class="coin-value" id="coin-value">0</div>
            </div>
            <div id="high-score-display">
                <div class="hs-label">🏆 最高分</div>
                <div class="hs-value">${this.highScore}</div>
            </div>
        `;
        document.body.appendChild(this.hud);

        // 开始界面
        this.startScreen = document.createElement('div');
        this.startScreen.id = 'start-screen';
        this.startScreen.innerHTML = `
            <div class="start-content">
                <h1 class="game-title">🏃 地铁跑酷</h1>
                <div class="game-subtitle">个人定制版</div>
                <div class="instructions">
                    <div class="control-row">
                        <span class="key">← →</span> 切换跑道
                    </div>
                    <div class="control-row">
                        <span class="key">↑</span> 跳跃
                    </div>
                    <div class="control-row">
                        <span class="key">↓</span> 滑铲
                    </div>
                    <div class="control-row mobile-only">
                        📱 滑动屏幕操控
                    </div>
                </div>
                <button id="start-btn" class="game-btn">开始游戏</button>
                <div class="credits">
                    🥤 躲避雪碧追击者 &nbsp;|&nbsp; 🍦 收集巧乐兹
                </div>
            </div>
        `;
        document.body.appendChild(this.startScreen);

        // 结束界面
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.id = 'gameover-screen';
        this.gameOverScreen.style.display = 'none';
        this.gameOverScreen.innerHTML = `
            <div class="gameover-content">
                <h1 class="gameover-title">游戏结束</h1>
                <div class="final-score" id="final-score">得分: 0</div>
                <div class="final-coins" id="final-coins">🍦 巧乐兹: 0</div>
                <div class="new-highscore" id="new-highscore" style="display:none;">🎉 新纪录!</div>
                <button id="restart-btn" class="game-btn">再来一局</button>
            </div>
        `;
        document.body.appendChild(this.gameOverScreen);
    }

    showStartScreen() {
        this.startScreen.style.display = 'flex';
        this.gameOverScreen.style.display = 'none';
        this.hud.style.display = 'none';
    }

    hideStartScreen() {
        this.startScreen.style.display = 'none';
        this.hud.style.display = 'flex';
    }

    showGameOver(finalScore, finalCoins) {
        this.gameOverScreen.style.display = 'flex';
        this.hud.style.display = 'none';

        document.getElementById('final-score').textContent = `得分: ${finalScore}`;
        document.getElementById('final-coins').textContent = `🍦 巧乐兹: ${finalCoins}`;

        const isNew = finalScore > this.highScore;
        if (isNew) {
            this.highScore = finalScore;
            localStorage.setItem('subway_high_score', this.highScore.toString());
            document.getElementById('new-highscore').style.display = 'block';
        } else {
            document.getElementById('new-highscore').style.display = 'none';
        }

        document.getElementById('high-score-display').querySelector('.hs-value').textContent = this.highScore;
    }

    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
        this.hud.style.display = 'flex';
    }

    updateScore(score) {
        this.score = score;
        const el = document.getElementById('score-value');
        if (el) el.textContent = Math.floor(score);
    }

    updateCoins(coins) {
        this.coins = coins;
        const el = document.getElementById('coin-value');
        if (el) el.textContent = coins;
    }

    getStartButton() {
        return document.getElementById('start-btn');
    }

    getRestartButton() {
        return document.getElementById('restart-btn');
    }
}
