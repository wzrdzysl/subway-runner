// 轨道系统 - 无限滚动地面和场景装饰
class Track {
    constructor(scene) {
        this.scene = scene;
        this.groundTiles = [];
        this.leftWallTiles = [];
        this.rightWallTiles = [];
        this.buildingPool = [];
        this.trainTrackLines = [];

        this.tileLength = 20;
        this.numTiles = 12;

        this._createGround();
        this._createLaneMarkings();
        this._createDecorations();
    }

    _createGround() {
        // 地面材质
        const groundGeo = new THREE.PlaneGeometry(GAME_CONFIG.GROUND_WIDTH, this.tileLength);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8,
        });

        for (let i = 0; i < this.numTiles; i++) {
            const tile = new THREE.Mesh(groundGeo, groundMat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(0, -0.01, i * this.tileLength);
            tile.receiveShadow = true;
            this.scene.add(tile);
            this.groundTiles.push(tile);
        }

        // 左右墙体
        const wallGeo = new THREE.BoxGeometry(0.5, 3, this.tileLength);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });

        for (let i = 0; i < this.numTiles; i++) {
            // 左墙
            const leftWall = new THREE.Mesh(wallGeo, wallMat);
            leftWall.position.set(-GAME_CONFIG.GROUND_WIDTH / 2, 1.5, i * this.tileLength);
            leftWall.castShadow = true;
            leftWall.receiveShadow = true;
            this.scene.add(leftWall);
            this.leftWallTiles.push(leftWall);

            // 右墙
            const rightWall = new THREE.Mesh(wallGeo, wallMat);
            rightWall.position.set(GAME_CONFIG.GROUND_WIDTH / 2, 1.5, i * this.tileLength);
            rightWall.castShadow = true;
            rightWall.receiveShadow = true;
            this.scene.add(rightWall);
            this.rightWallTiles.push(rightWall);
        }
    }

    _createLaneMarkings() {
        // 3条铁轨线
        const railMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.3, metalness: 0.5 });

        for (let lane = 0; lane < GAME_CONFIG.LANE_COUNT; lane++) {
            const x = GAME_CONFIG.LANE_POSITIONS[lane];

            for (let i = 0; i < this.numTiles; i++) {
                // 每条道2根铁轨
                for (let side = -1; side <= 1; side += 2) {
                    const railGeo = new THREE.BoxGeometry(0.08, 0.05, this.tileLength);
                    const rail = new THREE.Mesh(railGeo, railMat);
                    rail.position.set(x + side * 0.35, 0.03, i * this.tileLength);
                    rail.receiveShadow = true;
                    this.scene.add(rail);
                    this.trainTrackLines.push(rail);
                }

                // 枕木
                const sleeperGeo = new THREE.BoxGeometry(1.0, 0.02, 0.15);
                const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
                for (let j = 0; j < 10; j++) {
                    const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
                    sleeper.position.set(x, 0.01, i * this.tileLength + j * 2);
                    this.scene.add(sleeper);
                    this.trainTrackLines.push(sleeper);
                }
            }
        }
    }

    _createDecorations() {
        // 随机建筑（两侧）
        const buildingColors = [0xE8D5B7, 0xC4A882, 0xD4C4A8, 0xB8B8C8, 0xA8C8D8, 0xC8B8A8];

        for (let i = 0; i < 30; i++) {
            const w = 1.5 + Math.random() * 3;
            const h = 3 + Math.random() * 8;
            const d = 1 + Math.random() * 3;
            const geo = new THREE.BoxGeometry(w, h, d);
            const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

            const building = new THREE.Mesh(geo, mat);
            const side = Math.random() > 0.5 ? 1 : -1;
            const z = i * 8 - 20;
            const x = side * (GAME_CONFIG.GROUND_WIDTH / 2 + 2 + Math.random() * 6);
            building.position.set(x, h / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
            this.buildingPool.push({ mesh: building, baseZ: z });
        }

        // 随机路灯
        for (let i = 0; i < 15; i++) {
            const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
            const pole = new THREE.Mesh(poleGeo, poleMat);

            const side = Math.random() > 0.5 ? 1 : -1;
            const z = i * 14 - 10;
            const x = side * (GAME_CONFIG.GROUND_WIDTH / 2 + 1);
            pole.position.set(x, 2.5, z);
            pole.castShadow = true;
            this.scene.add(pole);
            this.buildingPool.push({ mesh: pole, baseZ: z });
        }
    }

    update(gameSpeed) {
        // 移动地面块
        for (const tile of this.groundTiles) {
            tile.position.z -= gameSpeed;
            if (tile.position.z < -this.tileLength) {
                tile.position.z += this.numTiles * this.tileLength;
            }
        }

        // 移动墙体
        for (const wall of this.leftWallTiles) {
            wall.position.z -= gameSpeed;
            if (wall.position.z < -this.tileLength) {
                wall.position.z += this.numTiles * this.tileLength;
            }
        }
        for (const wall of this.rightWallTiles) {
            wall.position.z -= gameSpeed;
            if (wall.position.z < -this.tileLength) {
                wall.position.z += this.numTiles * this.tileLength;
            }
        }

        // 移动铁轨
        for (const rail of this.trainTrackLines) {
            rail.position.z -= gameSpeed;
            if (rail.position.z < -this.tileLength) {
                rail.position.z += this.numTiles * this.tileLength;
            }
        }

        // 移动建筑
        for (const item of this.buildingPool) {
            item.mesh.position.z -= gameSpeed;
            if (item.mesh.position.z < -30) {
                item.mesh.position.z += 240;
            }
        }
    }
}
