// 音频管理器
class AudioManager {
    constructor() {
        this.bgm = null;
        this.deathSfx = null;
        this.jumpSfx = null;
        this.bgmPlaying = false;
        this.bgmReady = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // 背景音乐 - 预加载
        this.bgm = new Audio();
        this.bgm.preload = 'auto';
        this.bgm.loop = true;
        this.bgm.volume = 0.5;
        this.bgm.src = 'assets/bgm.mp3';
        this.bgm.load();

        // 监听加载完成
        this.bgm.addEventListener('canplaythrough', () => {
            this.bgmReady = true;
            console.log('BGM ready');
        }, { once: true });

        // 加载失败降级
        this.bgm.addEventListener('error', () => {
            console.log('BGM load failed, continuing without music');
            this.bgmReady = true; // 不阻塞游戏
        }, { once: true });

        // 死亡音效
        this.deathSfx = new Audio('assets/death.mp3');
        this.deathSfx.preload = 'auto';
        this.deathSfx.volume = 0.8;

        // 跳跃音效
        this.jumpSfx = new Audio('assets/jump.mp3');
        this.jumpSfx.preload = 'auto';
        this.jumpSfx.volume = 0.4;

        this.initialized = true;
    }

    playBGM() {
        if (!this.initialized) this.init();
        if (this.bgmPlaying) return;

        // 确保音频加载完毕再播放
        const tryPlay = () => {
            this.bgm.currentTime = 0;
            this.bgm.play().then(() => {
                console.log('BGM playing');
                this.bgmPlaying = true;
            }).catch(e => {
                console.log('BGM blocked:', e.message);
                // 重试一次（某些浏览器需要更明确的用户交互）
                setTimeout(() => {
                    this.bgm.play().then(() => {
                        this.bgmPlaying = true;
                    }).catch(() => {});
                }, 200);
            });
        };

        if (this.bgmReady) {
            tryPlay();
        } else {
            // 还没加载完，等一等
            const onReady = () => {
                this.bgm.removeEventListener('canplaythrough', onReady);
                tryPlay();
            };
            this.bgm.addEventListener('canplaythrough', onReady, { once: true });
            // 超时保护：1秒后无论如何尝试
            setTimeout(() => {
                if (!this.bgmPlaying) {
                    this.bgm.removeEventListener('canplaythrough', onReady);
                    tryPlay();
                }
            }, 1000);
        }
    }

    stopBGM() {
        if (!this.bgm) return;
        this.bgm.pause();
        this.bgm.currentTime = 0;
        this.bgmPlaying = false;
    }

    playDeath() {
        if (!this.initialized) this.init();
        if (this.deathSfx) {
            this.deathSfx.currentTime = 0;
            this.deathSfx.play().catch(() => {});
        }
    }

    playJump() {
        if (!this.initialized) this.init();
        if (this.jumpSfx) {
            this.jumpSfx.currentTime = 0;
            this.jumpSfx.play().catch(() => {});
        }
    }
}

// 全局实例
const audioManager = new AudioManager();
