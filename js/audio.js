// 音频管理器 - 稳健版
class AudioManager {
    constructor() {
        this.bgmPlaying = false;
        this.muted = false;
        this._initDone = false;
    }

    init() {
        if (this._initDone) return;
        this._initDone = true;

        // 一次性创建所有音频元素并预加载
        this._createAudio('bgm', 'assets/bgm.mp3', { loop: true, volume: 0.5 });
        this._createAudio('death', 'assets/death.mp3', { loop: false, volume: 0.8 });
        this._createAudio('jump', 'assets/jump.mp3', { loop: false, volume: 0.4 });
    }

    _createAudio(key, src, opts) {
        const a = document.createElement('audio');
        a.preload = 'auto';
        a.src = src;
        a.loop = opts.loop || false;
        a.volume = opts.volume || 0.5;
        a.load();

        // 预加载到能播放
        a.addEventListener('canplaythrough', () => {
            this['_' + key + 'Ready'] = true;
        }, { once: true });

        a.addEventListener('error', (e) => {
            console.warn('Audio load error:', key, e.target.error);
            // 降级标记为就绪避免阻塞
            this['_' + key + 'Ready'] = true;
        }, { once: true });

        this['_' + key] = a;
    }

    _playAudio(key) {
        const a = this['_' + key];
        if (!a) return;
        if (this.muted) return;

        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) {
            p.catch(() => {
                // 重试一次（某些浏览器第一次拒绝，第二次接受）
                setTimeout(() => {
                    a.currentTime = 0;
                    a.play().catch(() => {});
                }, 100);
            });
        }
    }

    playBGM() {
        if (!this._initDone) this.init();
        if (this.bgmPlaying) return;

        const tryBGM = () => {
            const a = this._bgm;
            if (!a) return;
            a.currentTime = 0;
            a.play().then(() => {
                this.bgmPlaying = true;
            }).catch(() => {
                // 再试
                setTimeout(() => {
                    a.play().then(() => {
                        this.bgmPlaying = true;
                    }).catch(() => {});
                }, 200);
            });
        };

        if (this._bgmReady) {
            tryBGM();
        } else {
            // 还没加载完就等
            const onReady = () => { tryBGM(); };
            this._bgm.addEventListener('canplaythrough', onReady, { once: true });
            setTimeout(() => {
                if (!this.bgmPlaying) tryBGM();
            }, 1500);
        }
    }

    stopBGM() {
        const a = this._bgm;
        if (!a) return;
        a.pause();
        a.currentTime = 0;
        this.bgmPlaying = false;
    }

    playDeath() {
        this._playAudio('death');
    }

    playJump() {
        this._playAudio('jump');
    }
}

const audioManager = new AudioManager();
