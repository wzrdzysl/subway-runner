// 输入管理器 - 键盘 + 触屏
class InputManager {
    constructor() {
        this.keys = {};
        this.swipeLeft = false;
        this.swipeRight = false;
        this.swipeUp = false;
        this.swipeDown = false;

        this._touchStartX = 0;
        this._touchStartY = 0;
        this._touchStartTime = 0;
        this._swipeThreshold = 30; // 最小滑动距离
        this._swipeTimeThreshold = 500; // 最大滑动时间(ms)

        this._setupKeyboard();
        this._setupTouch();
    }

    _setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // 防止页面滚动
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    _setupTouch() {
        const canvas = document.querySelector('canvas') || document.body;

        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this._touchStartX = touch.clientX;
            this._touchStartY = touch.clientY;
            this._touchStartTime = Date.now();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this._touchStartX;
            const dy = touch.clientY - this._touchStartY;
            const dt = Date.now() - this._touchStartTime;

            // 重置所有滑动状态
            this.swipeLeft = false;
            this.swipeRight = false;
            this.swipeUp = false;
            this.swipeDown = false;

            if (dt > this._swipeTimeThreshold) return;

            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx < this._swipeThreshold && absDy < this._swipeThreshold) return;

            if (absDx > absDy) {
                // 左右滑动
                if (dx > 0) this.swipeRight = true;
                else this.swipeLeft = true;
            } else {
                // 上下滑动
                if (dy < 0) this.swipeUp = true;
                else this.swipeDown = true;
            }
        }, { passive: false });

        // 阻止触屏默认行为（防止页面滚动/缩放）
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    isKeyDown(key) {
        return !!this.keys[key];
    }

    consumeSwipeLeft() {
        const v = this.swipeLeft;
        this.swipeLeft = false;
        return v;
    }

    consumeSwipeRight() {
        const v = this.swipeRight;
        this.swipeRight = false;
        return v;
    }

    consumeSwipeUp() {
        const v = this.swipeUp;
        this.swipeUp = false;
        return v;
    }

    consumeSwipeDown() {
        const v = this.swipeDown;
        this.swipeDown = false;
        return v;
    }

    // 消耗型按键检测（按下后自动清除状态，防止重复触发）
    consumeKey(key) {
        const v = this.keys[key];
        if (v) {
            this.keys[key] = false;
            return true;
        }
        return false;
    }

    // 综合判断：需要左移（消耗型）
    wantsMoveLeft() {
        return this.consumeKey('ArrowLeft') || this.consumeKey('a') || this.consumeKey('A') || this.consumeSwipeLeft();
    }

    // 综合判断：需要右移（消耗型）
    wantsMoveRight() {
        return this.consumeKey('ArrowRight') || this.consumeKey('d') || this.consumeKey('D') || this.consumeSwipeRight();
    }

    // 综合判断：需要跳跃（消耗型）
    wantsJump() {
        return this.consumeKey('ArrowUp') || this.consumeKey('w') || this.consumeKey('W') || this.consumeSwipeUp();
    }

    // 综合判断：需要滑铲（消耗型）
    wantsSlide() {
        return this.consumeKey('ArrowDown') || this.consumeKey('s') || this.consumeKey('S') || this.consumeSwipeDown();
    }
}
