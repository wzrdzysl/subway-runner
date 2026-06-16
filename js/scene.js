// Three.js 场景管理
class GameScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    init(container) {
        // 场景
        this.scene = new THREE.Scene();

        // 天空色背景
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 120);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 摄像机
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(GAME_CONFIG.FOV, aspect, GAME_CONFIG.NEAR, GAME_CONFIG.FAR);
        this.camera.position.set(0, GAME_CONFIG.CAMERA_Y, GAME_CONFIG.CAMERA_Z);
        this.camera.lookAt(0, GAME_CONFIG.CAMERA_LOOK_Y, GAME_CONFIG.CAMERA_LOOK_Z);

        // 光照
        this._setupLights();

        // 窗口自适应
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        console.log('Scene initialized');
    }

    _setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // 主方向光（模拟太阳）
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(20, 30, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 100;
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -20;
        this.scene.add(sun);

        // 补光
        const fill = new THREE.DirectionalLight(0xffffff, 0.3);
        fill.position.set(-10, 5, -5);
        this.scene.add(fill);
    }

    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
