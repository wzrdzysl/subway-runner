// 游戏常量配置
const GAME_CONFIG = {
    // 跑道
    LANE_COUNT: 3,
    LANE_WIDTH: 2.5,
    LANE_POSITIONS: [-2.5, 0, 2.5], // 左、中、右

    // 玩家
    PLAYER_SPEED: 0.15,        // 切换跑道动画速度
    JUMP_HEIGHT: 3.5,
    JUMP_DURATION: 0.6,        // 跳跃持续时间(秒)
    SLIDE_DURATION: 0.5,       // 滑铲持续时间(秒)

    // 游戏速度
    INITIAL_SPEED: 0.15,
    MAX_SPEED: 0.5,
    SPEED_INCREMENT: 0.0001,   // 每帧速度增量

    // 障碍物
    OBSTACLE_MIN_INTERVAL: 0.8,  // 最小生成间隔(秒)
    OBSTACLE_MAX_INTERVAL: 2.0,  // 最大生成间隔(秒)
    OBSTACLE_SPAWN_DISTANCE: 40, // 生成距离

    // 巧乐兹收集物
    COIN_SPAWN_INTERVAL: 1.5,  // 生成间隔(秒)
    COIN_SPAWN_DISTANCE: 35,
    COIN_VALUE: 10,            // 每个分值
    COIN_GROUP_CHANCE: 0.15,   // 同时生成多个的概率

    // 雪碧追击者
    CHASER_SPAWN_TIME: 15,     // 首次出现时间(秒)
    CHASER_INTERVAL: 20,       // 出现间隔(秒)
    CHASER_DISTANCE: 20,       // 初始后方距离

    // 场景
    TRACK_LENGTH: 200,
    GROUND_WIDTH: 12,

    // 渲染
    FOV: 70,
    NEAR: 0.1,
    FAR: 200,

    // 摄像机
    CAMERA_Y: 6,
    CAMERA_Z: -8,
    CAMERA_LOOK_Y: 1.5,
    CAMERA_LOOK_Z: 15,
};
