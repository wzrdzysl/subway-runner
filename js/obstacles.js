// 障碍物系统 - 多样障碍物类型
class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.chaser = null;
        this.chaserActive = false;

        this.spawnTimer = 0;
        this.spawnCooldown = 1.0;
        this.chaserTimer = 0;

        this._createChaser();
    }

    _createChaser() {
        // 雪碧追击者
        this.chaser = new THREE.Group();

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('assets/sprite_can.png');

        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            map: texture, roughness: 0.3, metalness: 0.1,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        this.chaser.add(body);

        // 标签
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128; labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('雪碧', 64, 42);

        const labelTex = new THREE.CanvasTexture(labelCanvas);
        const labelGeo = new THREE.PlaneGeometry(0.8, 0.4);
        const labelMat = new THREE.MeshStandardMaterial({
            map: labelTex, transparent: true, side: THREE.DoubleSide,
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, 1.5, 0.55);
        this.chaser.add(label);

        this.chaser.visible = false;
        this.chaser.position.set(0, 0, -GAME_CONFIG.CHASER_DISTANCE);
        this.scene.add(this.chaser);
    }

    _createObstacle(laneIndex, type, extraLanes) {
        const x = GAME_CONFIG.LANE_POSITIONS[laneIndex];
        const group = new THREE.Group();
        group.userData = {
            lane: laneIndex,
            type: type,
            extraLanes: extraLanes || [],
            swayDir: Math.random() > 0.5 ? 1 : -1,
            swayOffset: 0,
            swaySpeed: 0.02 + Math.random() * 0.03,
        };

        switch (type) {
            case 'barrier':
                // ===== 高路障 - 需要跳跃 =====
                this._buildBarrier(group, 0xFF4444, 1.5);
                break;

            case 'low_barrier':
                // ===== 低路障 - 需要滑铲 =====
                this._buildLowBarrier(group, 0xFF8800);
                break;

            case 'wide_train':
                // ===== 宽体列车 - 占2条道 =====
                this._buildWideTrain(group, laneIndex, extraLanes);
                break;

            case 'rolling_drum':
                // ===== 滚动桶 - 左右摇摆 =====
                this._buildRollingDrum(group);
                break;

            case 'spike_trap':
                // ===== 地面尖刺 - 必须跳跃 =====
                this._buildSpikeTrap(group);
                break;

            case 'moving_barrier':
                // ===== 移动路障 - 左右平移 =====
                this._buildBarrier(group, 0xCC44FF, 1.3);
                group.userData.swayAmplitude = 1.5;
                break;
        }

        group.position.set(x, 0, GAME_CONFIG.OBSTACLE_SPAWN_DISTANCE);
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    _buildBarrier(group, color, height) {
        const barGeo = new THREE.BoxGeometry(1.0, height, 0.5);
        const barMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.y = height / 2;
        bar.castShadow = true;
        group.add(bar);

        // 支架
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, height * 0.7, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        for (let side = -1; side <= 1; side += 2) {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(side * 0.4, height * 0.35, 0);
            leg.castShadow = true;
            group.add(leg);
        }

        // 警告灯
        const lightGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.8
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.y = height + 0.15;
        group.add(light);
        group.userData.warningLight = light;
    }

    _buildLowBarrier(group, color) {
        const barGeo = new THREE.BoxGeometry(1.5, 0.5, 0.4);
        const barMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.y = 0.25;
        bar.castShadow = true;
        group.add(bar);

        // 两侧标记柱
        for (let side = -1; side <= 1; side += 2) {
            const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0xFFAA00, emissive: 0xFF6600, emissiveIntensity: 0.4 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(side * 0.7, 0.4, 0);
            group.add(pole);
        }
    }

    _buildWideTrain(group, myLane, extraLanes) {
        // 宽体障碍物，横跨多条跑道
        const allLanes = [myLane, ...extraLanes];
        const minX = Math.min(...allLanes.map(l => GAME_CONFIG.LANE_POSITIONS[l]));
        const maxX = Math.max(...allLanes.map(l => GAME_CONFIG.LANE_POSITIONS[l]));
        const centerX = (minX + maxX) / 2;
        const width = (maxX - minX) + 2.2;

        const bodyGeo = new THREE.BoxGeometry(width, 2.0, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x3355AA, roughness: 0.4, metalness: 0.6,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(centerX - GAME_CONFIG.LANE_POSITIONS[myLane], 1.0, 0);
        body.castShadow = true;
        group.add(body);

        // 车窗效果
        for (let i = 0; i < 3; i++) {
            const winGeo = new THREE.BoxGeometry(0.4, 0.4, 0.05);
            const winMat = new THREE.MeshStandardMaterial({
                color: 0xAADDFF, emissive: 0x4488AA, emissiveIntensity: 0.5,
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(
                centerX - GAME_CONFIG.LANE_POSITIONS[myLane] + (i - 1) * 0.7,
                1.3, 0.45
            );
            group.add(win);
        }

        // 存储占用车道信息
        group.userData.occupiedLanes = allLanes;
        group.userData.trainWidth = width;
    }

    _buildRollingDrum(group) {
        // 滚动的桶
        const drumGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.3, 12);
        const drumMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513, roughness: 0.6, metalness: 0.3,
        });
        const drum = new THREE.Mesh(drumGeo, drumMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.y = 0.55;
        drum.castShadow = true;
        group.add(drum);
        group.userData.drum = drum;

        // 金属环
        for (let s = -1; s <= 1; s += 2) {
            const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 16);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(s * 0.65, 0.55, 0);
            group.add(ring);
        }
    }

    _buildSpikeTrap(group) {
        // 地面尖刺陷阱
        const spikeCount = 5;
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.12, 0.5, 6);
            const spikeMat = new THREE.MeshStandardMaterial({
                color: 0xCC0000, roughness: 0.2, metalness: 0.7,
                emissive: 0x330000, emissiveIntensity: 0.3,
            });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set((i - 2) * 0.2, 0.25, 0);
            spike.castShadow = true;
            group.add(spike);
        }

        // 底座
        const baseGeo = new THREE.BoxGeometry(1.2, 0.06, 0.5);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.03;
        group.add(base);
    }

    update(delta, gameSpeed, playerLane, playerPos) {
        // 生成障碍物
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnCooldown) {
            this.spawnTimer = 0;
            this.spawnCooldown = GAME_CONFIG.OBSTACLE_MIN_INTERVAL +
                Math.random() * (GAME_CONFIG.OBSTACLE_MAX_INTERVAL - GAME_CONFIG.OBSTACLE_MIN_INTERVAL);

            this._spawnRandomObstacle(playerLane);
        }

        // 更新障碍物
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z -= gameSpeed;

            // 闪烁灯
            if (obs.userData.warningLight) {
                const intensity = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.005));
                obs.userData.warningLight.material.emissiveIntensity = intensity;
            }

            // 滚动桶旋转
            if (obs.userData.drum) {
                obs.userData.drum.rotation.x += gameSpeed * 3;
            }

            // 摇摆障碍物
            if (obs.userData.swayAmplitude) {
                obs.userData.swayOffset += obs.userData.swaySpeed * obs.userData.swayDir;
                if (Math.abs(obs.userData.swayOffset) > obs.userData.swayAmplitude) {
                    obs.userData.swayDir *= -1;
                }
                const baseX = GAME_CONFIG.LANE_POSITIONS[obs.userData.lane];
                obs.position.x = baseX + obs.userData.swayOffset;
            }

            // 移除远处
            if (obs.position.z < -10) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // 雪碧追击者 - 纯视觉跟随，只在玩家撞障碍物时"逮捕"（参照地铁跑酷设定）
        this.chaserTimer += delta;
        if (!this.chaserActive && this.chaserTimer > 3) {
            this.chaserActive = true;
            this.chaser.visible = true;
            this.chaser.position.set(
                GAME_CONFIG.LANE_POSITIONS[playerLane],
                0,
                playerPos.z - 10
            );
        }

        if (this.chaserActive) {
            // 始终跟随在玩家后方
            const targetX = GAME_CONFIG.LANE_POSITIONS[playerLane];
            const targetZ = playerPos.z - 10;
            this.chaser.position.x += (targetX - this.chaser.position.x) * 0.06;
            this.chaser.position.z += (targetZ - this.chaser.position.z) * 0.1;
        }
        // 追击者本身不会导致游戏结束，只有玩家撞到障碍物才会被"逮捕"

        return null;
    }

    _spawnRandomObstacle(playerLane) {
        const types = ['barrier', 'low_barrier', 'wide_train', 'rolling_drum', 'spike_trap', 'moving_barrier'];
        const weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10];
        const roll = Math.random();
        let type = 'barrier';
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (roll < cumulative) { type = types[i]; break; }
        }

        // 确保至少有一条道是安全的（宽体列车除外）
        if (type === 'wide_train') {
            // 随机选2条邻接的跑道占用
            const startLane = Math.floor(Math.random() * 2); // 0 or 1
            const lanes = [startLane, startLane + 1];
            // 如果玩家在这两条道上，也能通过跳到第三道躲过
            this._createObstacle(startLane, type, [startLane + 1]);
        } else if (type === 'rolling_drum' || type === 'moving_barrier') {
            // 摇摆型障碍物，避开玩家当前道
            const availableLanes = [0, 1, 2].filter(l => l !== playerLane);
            const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            this._createObstacle(lane, type);
        } else {
            // 普通障碍物，随机道但大概率避开玩家
            const availableLanes = [0, 1, 2].filter(l => l !== playerLane);
            let lane;
            if (Math.random() < 0.6 && availableLanes.length > 0) {
                lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            } else {
                lane = Math.floor(Math.random() * 3);
            }
            this._createObstacle(lane, type);
        }
    }

    checkCollision(playerPos, isJumping, isSliding) {
        const px = playerPos.x;
        const py = playerPos.y;
        const pz = playerPos.z;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const ox = obs.position.x;
            const oz = obs.position.z;
            const type = obs.userData.type;
            const dx = Math.abs(px - ox);
            const dz = Math.abs(pz - oz);

            if (dz > 1.2) continue; // 不在碰撞Z范围内

            switch (type) {
                case 'barrier':
                case 'moving_barrier':
                    // 需要跳跃
                    if (dx < 0.75 && (!isJumping || py < 1.5)) return true;
                    break;

                case 'low_barrier':
                    // 需要滑铲
                    if (dx < 0.9 && !isSliding) return true;
                    break;

                case 'wide_train':
                    // 检查是否在占用车道内
                    const occLanes = obs.userData.occupiedLanes;
                    if (occLanes) {
                        for (const laneIdx of occLanes) {
                            const laneX = GAME_CONFIG.LANE_POSITIONS[laneIdx];
                            if (Math.abs(px - laneX) < 0.7 && dz < 1.2) {
                                return true;
                            }
                        }
                    }
                    break;

                case 'rolling_drum':
                    // 摇摆桶 - 较宽碰撞
                    if (dx < 0.9 && (!isJumping || py < 1.0)) return true;
                    break;

                case 'spike_trap':
                    // 尖刺 - 必须跳跃
                    if (dx < 0.7 && (!isJumping || py < 1.2)) return true;
                    break;
            }
        }

        return false;
    }

    // 逮捕动画：雪碧从后方冲刺撞飞玩家
    triggerCatch(playerPos, playerMesh) {
        if (!this.chaserActive) {
            // 如果还没激活，强行激活
            this.chaserActive = true;
            this.chaser.visible = true;
            this.chaser.position.set(playerPos.x, 0, playerPos.z - 6);
        }

        // 记录目标位置
        this._catchTarget = { x: playerPos.x, z: playerPos.z };
        this._catchPhase = 'charging'; // charging → hit → done
        this._catchTimer = 0;
        this._catchPlayerMesh = playerMesh;
    }

    updateCatchAnimation(delta) {
        if (!this._catchPhase || this._catchPhase === 'done') return;

        this._catchTimer += delta;

        if (this._catchPhase === 'charging') {
            // 雪碧猛冲向玩家（0.3秒内冲到）
            const t = Math.min(this._catchTimer / 0.3, 1.0);
            const ease = t * t; // 加速逼近
            const startZ = this._catchTarget.z - 6 - (1 - ease) * 4;
            this.chaser.position.z = startZ + ease * (this._catchTarget.z + 0.5 - startZ);
            this.chaser.position.x += (this._catchTarget.x - this.chaser.position.x) * 0.2;

            if (t >= 1.0) {
                // 撞击！
                this._catchPhase = 'hit';
                this._catchTimer = 0;

                // 撞飞玩家
                if (this._catchPlayerMesh) {
                    this._catchPlayerMesh.position.y += 2.5;
                    this._catchPlayerMesh.position.z -= 2;
                    this._catchPlayerMesh.rotation.z = Math.PI * 0.6;
                    this._catchPlayerMesh.rotation.x = -0.4;
                }

                // 撞击粒子
                this._spawnImpactParticles(this.chaser.position.clone());

                // 闪烁
                this._flashChaser();
            }
        } else if (this._catchPhase === 'hit') {
            // 玩家落地
            if (this._catchPlayerMesh && this._catchTimer < 0.5) {
                this._catchPlayerMesh.position.y += (0.2 - this._catchPlayerMesh.position.y) * 0.1;
            }
            if (this._catchTimer > 1.5) {
                this._catchPhase = 'done';
            }
        }
    }

    _spawnImpactParticles(position) {
        const colors = [0xFF4444, 0xFF8800, 0xFFD700, 0xFFFFFF];
        for (let i = 0; i < 20; i++) {
            const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 1,
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.position.y += 1;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            particle.userData = {
                vx: Math.cos(angle) * speed,
                vy: 0.05 + Math.random() * 0.2,
                vz: (Math.random() - 0.5) * speed * 2,
                life: 0.8,
            };

            this.scene.add(particle);
            this._animateParticle(particle);
        }
    }

    _animateParticle(particle) {
        const animate = () => {
            particle.userData.life -= 0.016;
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                return;
            }
            particle.position.x += particle.userData.vx;
            particle.position.y += particle.userData.vy;
            particle.position.z += particle.userData.vz;
            particle.userData.vy -= 0.005; // 重力
            particle.material.opacity = particle.userData.life;
            requestAnimationFrame(animate);
        };
        animate();
    }

    _flashChaser() {
        let count = 0;
        const interval = setInterval(() => {
            this.chaser.visible = !this.chaser.visible;
            count++;
            if (count >= 6) {
                clearInterval(interval);
                this.chaser.visible = true;
            }
        }, 150);
    }

    reset() {
        for (const obs of this.obstacles) {
            this.scene.remove(obs);
        }
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnCooldown = 1.0;
        this.chaserActive = false;
        this.chaser.visible = false;
        this.chaser.position.set(0, 0, -GAME_CONFIG.CHASER_DISTANCE);
        this.chaserTimer = 0;
        this._catchPhase = 'done';
        this._catchTarget = null;
        this._catchPlayerMesh = null;
    }
}
