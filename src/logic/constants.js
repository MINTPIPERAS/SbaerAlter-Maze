// ══════════════════════════════════════════════
//  src/logic/constants.js
//  所有游戏常量集中管理
// ══════════════════════════════════════════════

// ─── 世界尺寸 ───
export const CELL_SIZE = 1.5          // 每个格子的世界单位（走廊宽度）
export const WALL_HEIGHT = 2.5        // 墙壁高度
export const PLAYER_RADIUS = 0.28     // 玩家碰撞半径

// ─── 移动参数 ───
export const MAX_WALK_SPEED = 3.5     // 步行最高速度
export const MAX_SPRINT_SPEED = 5.8   // 冲刺最高速度
export const ACCELERATION = 13.0      // 加速度系数
export const FRICTION = 9.0           // 摩擦力系数

// ─── 迷宫规模 ───
export const MAZE_ROWS = 21           // 迷宫行数（奇数）
export const MAZE_COLS = 21           // 迷宫列数（奇数）

// ─── 转向 ───
export const TURN_DURATION = 0.45     // 单次 90° 转向时长（秒）

// ─── 起点（固定左上角通道内） ───
export const START_CELL = { x: 1, z: 1 }
