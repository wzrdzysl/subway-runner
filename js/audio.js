// 音频管理器 - Web Audio API 版（彻底解决音效丢失问题）
class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.bgmSource = null;
        this.bgmGain = null;
        this.bgmPlaying = false;
        this.bgmStartTime = 0;
        this.bgmOffset = 0;
        this._initDone = false;
        this._unlocked = false;
    }

    _ensureCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    init() {
        if (this._initDone) return;
        this._initDone = true;
        this._ensureCtx();

        // 预加载所有音频到 AudioBuffer
        this._loadAudio('bgm', 'assets/bgm.mp3');
        this._loadAudio('death', 'assets/death.mp3');
        this._loadAudio('jump', 'assets/jump.mp3');

        // 首次用户交互时解锁音频
        const unlock = () => {
            if (this._unlocked) return;
            const ctx = this._ensureCtx();
            if (ctx.state === 'suspended') ctx.resume();
            // 播放一个无声缓冲来解锁
            const buf = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start();
            this._unlocked = true;
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }

    async _loadAudio(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const ctx = this._ensureCtx();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            this.buffers[key] = audioBuffer;
        } catch (e) {
            console.warn('Audio load failed:', key, e.message);
        }
    }

    _playBuffer(key, volume = 1.0, loop = false) {
        const ctx = this._ensureCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const buffer = this.buffers[key];
        if (!buffer) return null;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;

        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return { source, gain };
    }

    playBGM() {
        if (this.bgmPlaying) return;
        if (!this.buffers['bgm']) {
            // 还没加载完，等一等
            setTimeout(() => this.playBGM(), 500);
            return;
        }

        this.stopBGM();
        this.bgmGain = this._ensureCtx().createGain();
        this.bgmGain.gain.value = 0.5;

        const source = this._ensureCtx().createBufferSource();
        source.buffer = this.buffers['bgm'];
        source.loop = true;
        source.connect(this.bgmGain);
        this.bgmGain.connect(this._ensureCtx().destination);
        source.start(0);

        this.bgmSource = source;
        this.bgmPlaying = true;
    }

    stopBGM() {
        if (this.bgmSource) {
            try { this.bgmSource.stop(); } catch (e) {}
            this.bgmSource = null;
        }
        this.bgmPlaying = false;
    }

    playDeath() {
        this._ensureCtx().resume();
        this._playBuffer('death', 0.9);
    }

    playJump() {
        this._ensureCtx().resume();
        this._playBuffer('jump', 0.5);
    }
}

const audioManager = new AudioManager();
