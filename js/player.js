// 玩家角色控制
class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.currentLane = 1; // 0=左, 1=中, 2=右
        this.targetX = GAME_CONFIG.LANE_POSITIONS[1];
        this.baseY = 0;

        // 动作状态
        this.isJumping = false;
        this.isSliding = false;
        this.jumpTimer = 0;
        this.slideTimer = 0;
        this.jumpProgress = 0;
        this.slideProgress = 0;

        this._createCharacter();
    }

    _createCharacter() {
        // 创建角色组
        this.mesh = new THREE.Group();

        // 使用纹理贴图创建角色平面（始终面向摄像机）
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('assets/character.png');

        // 角色平面
        const charGeo = new THREE.PlaneGeometry(1.2, 2.5);
        const charMat = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
        });
        const charPlane = new THREE.Mesh(charGeo, charMat);
        charPlane.castShadow = true;
        charPlane.receiveShadow = true;
        this.mesh.add(charPlane);

        // 设置初始位置
        this.mesh.position.set(GAME_CONFIG.LANE_POSITIONS[1], 1.25, 0);
        this.scene.add(this.mesh);

        // 保存纹理引用用于 billboard
        this._charPlane = charPlane;
    }

    update(delta, input, gameSpeed) {
        // 跑道切换（按键由 InputManager 自动消耗）
        // 注意：摄像机在玩家后方，左右与实际屏幕方向对应
        if (input.wantsMoveLeft() && this.currentLane < 2) {
            this.currentLane++;
        }
        if (input.wantsMoveRight() && this.currentLane > 0) {
            this.currentLane--;
        }

        this.targetX = GAME_CONFIG.LANE_POSITIONS[this.currentLane];

        // 平滑过渡到目标跑道
        const dx = this.targetX - this.mesh.position.x;
        this.mesh.position.x += dx * Math.min(1, GAME_CONFIG.PLAYER_SPEED * gameSpeed * 60);

        // 跳跃（按键由 InputManager 自动消耗）
        if (input.wantsJump() && !this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.jumpTimer = 0;
        }

        if (this.isJumping) {
            this.jumpTimer += delta;
            const t = this.jumpTimer / GAME_CONFIG.JUMP_DURATION;
            // 抛物线跳跃
            this.mesh.position.y = this.baseY + Math.sin(t * Math.PI) * GAME_CONFIG.JUMP_HEIGHT;

            if (t >= 1.0) {
                this.isJumping = false;
                this.mesh.position.y = this.baseY;
            }
        }

        // 滑铲（按键由 InputManager 自动消耗）
        if (input.wantsSlide() && !this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.slideTimer = 0;
        }

        if (this.isSliding) {
            this.slideTimer += delta;
            const t = this.slideTimer / GAME_CONFIG.SLIDE_DURATION;

            // 缩小 Y 轴模拟滑铲
            const scaleY = 1.0 - 0.6 * Math.sin(t * Math.PI / 2);
            this.mesh.scale.set(1.0, scaleY, 1.0);
            this.mesh.position.y = this.baseY - 0.4 * Math.sin(t * Math.PI / 2);

            if (t >= 1.0) {
                this.isSliding = false;
                this.mesh.scale.set(1.0, 1.0, 1.0);
                this.mesh.position.y = this.baseY;
            }
        }

        // 跑步上下弹跳动画
        if (!this.isJumping && !this.isSliding) {
            const bounce = Math.sin(Date.now() * 0.01) * 0.15;
            this.mesh.position.y = this.baseY + bounce;
        }
    }

    getPosition() {
        return this.mesh.position;
    }

    getLane() {
        return this.currentLane;
    }

    // 让角色平面始终面向摄像机
    updateBillboard(camera) {
        if (this._charPlane) {
            this._charPlane.lookAt(camera.position);
        }
    }

    // 死亡动画
    playDeathAnimation() {
        this.mesh.rotation.z = Math.PI / 2;
        this.mesh.position.y = 0.2;
    }

    reset() {
        this.currentLane = 1;
        this.targetX = GAME_CONFIG.LANE_POSITIONS[1];
        this.isJumping = false;
        this.isSliding = false;
        this.jumpTimer = 0;
        this.slideTimer = 0;
        this.mesh.position.set(GAME_CONFIG.LANE_POSITIONS[1], 1.25, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.mesh.scale.set(1.0, 1.0, 1.0);
    }
}
