// 音频管理器
class AudioManager {
    constructor() {
        this.bgm = null;
        this.deathSfx = null;
        this.bgmPlaying = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // 背景音乐
        this.bgm = new Audio('assets/bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.5;

        // 死亡音效
        this.deathSfx = new Audio('assets/death.mp3');
        this.deathSfx.volume = 0.8;

        // 跳跃音效
        this.jumpSfx = new Audio('assets/jump.mp3');
        this.jumpSfx.volume = 0.4;

        this.initialized = true;
    }

    playBGM() {
        if (!this.initialized) this.init();
        if (this.bgmPlaying) return;

        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => {
            console.log('BGM autoplay blocked, waiting for user interaction');
        });
        this.bgmPlaying = true;
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
            this.deathSfx.play().catch(e => console.log('SFX play blocked'));
        }
    }

    playJump() {
        if (!this.initialized) this.init();
        if (this.jumpSfx) {
            this.jumpSfx.currentTime = 0;
            this.jumpSfx.play().catch(e => {});
        }
    }

    setBGMVolume(v) {
        if (this.bgm) this.bgm.volume = Math.max(0, Math.min(1, v));
    }

    setSFXVolume(v) {
        if (this.deathSfx) this.deathSfx.volume = Math.max(0, Math.min(1, v));
    }
}

// 全局实例
const audioManager = new AudioManager();
