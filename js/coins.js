// 收集物系统 - 巧乐兹
class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.coins = [];
        this.spawnTimer = 0;
        this.spawnCooldown = GAME_CONFIG.COIN_SPAWN_INTERVAL;
        this._createCoinTexture();
    }

    _createCoinTexture() {
        // 使用巧乐兹贴图 + Canvas 生成纹理
        const textureLoader = new THREE.TextureLoader();
        this.coinTexture = textureLoader.load('assets/qiaolezi.png');
    }

    _createCoin(laneIndex) {
        const x = GAME_CONFIG.LANE_POSITIONS[laneIndex] + (Math.random() - 0.5) * 0.4;
        const group = new THREE.Group();

        // 巧乐兹主体 - 扁平长方体
        const coinGeo = new THREE.BoxGeometry(0.4, 0.6, 0.08);
        const coinMat = new THREE.MeshStandardMaterial({
            map: this.coinTexture,
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0x222222,
            emissiveIntensity: 0.3,
        });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.castShadow = true;
        group.add(coin);

        // 发光光环
        const glowGeo = new THREE.RingGeometry(0.3, 0.45, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = 0.05;
        group.add(glow);

        group.position.set(x, 1.0 + Math.random() * 0.5, GAME_CONFIG.COIN_SPAWN_DISTANCE);
        group.rotation.x = Math.PI / 2; // 面朝玩家
        this.scene.add(group);
        this.coins.push(group);
    }

    update(delta, gameSpeed, playerPos) {
        // 定时生成巧乐兹（而非每帧概率）
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            // 随机间隔：1~2.5秒
            this.spawnCooldown = GAME_CONFIG.COIN_SPAWN_INTERVAL + Math.random() * 1.0;

            // 大多数时候只生成1个，偶尔生成一排
            if (Math.random() < GAME_CONFIG.COIN_GROUP_CHANCE) {
                // 三个跑道各一个
                for (let l = 0; l < 3; l++) {
                    this._createCoin(l);
                }
            } else {
                const lane = Math.floor(Math.random() * 3);
                this._createCoin(lane);
            }
        }

        // 移动收集物
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.position.z -= gameSpeed;

            // 旋转动画
            coin.rotation.z += 0.05;

            // 上下浮动
            coin.position.y += Math.sin(Date.now() * 0.005 + i) * 0.005;

            // 移除远处的
            if (coin.position.z < -10) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }
    }

    checkCollection(playerPos, isSliding) {
        const px = playerPos.x;
        const py = playerPos.y;
        const pz = playerPos.z;
        let collected = 0;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const dx = Math.abs(px - coin.position.x);
            const dy = Math.abs(py - coin.position.y - 1.0);
            const dz = Math.abs(pz - coin.position.z);

            // 收集范围
            const collectRange = isSliding ? 1.5 : 1.0;

            if (dx < collectRange && dy < collectRange && dz < collectRange) {
                // 收集动画效果
                this._collectEffect(coin.position.clone());

                this.scene.remove(coin);
                this.coins.splice(i, 1);
                collected += GAME_CONFIG.COIN_VALUE;
            }
        }

        return collected;
    }

    _collectEffect(position) {
        // 简单的粒子效果
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.SphereGeometry(0.05, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);

            const angle = (i / particleCount) * Math.PI * 2;
            particle.userData = {
                vx: Math.cos(angle) * 0.1,
                vy: Math.sin(angle) * 0.1 + 0.05,
                vz: (Math.random() - 0.5) * 0.1,
                life: 0.5,
            };

            this.scene.add(particle);

            // 自动移除
            setTimeout(() => {
                this.scene.remove(particle);
                geo.dispose();
                mat.dispose();
            }, 500);
        }
    }

    getCoinCount() {
        return this.coins.length;
    }

    reset() {
        for (const coin of this.coins) {
            this.scene.remove(coin);
        }
        this.coins = [];
        this.spawnTimer = 0;
        this.spawnCooldown = GAME_CONFIG.COIN_SPAWN_INTERVAL;
    }
}
