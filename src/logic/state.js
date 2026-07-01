// ══════════════════════════════════════════════
//  src/logic/state.js
//  集中管理所有游戏运行时可变状态
//  各逻辑模块 import { state } 直接读写
// ══════════════════════════════════════════════

import { ref } from 'vue'

// ─── Vue 响应式（供模板绑定） ───
export const characterReady = ref(false)       // 模型加载完成标志
export const viewMode = ref(1)                 // 0=第一人称 1=第三人称 2=上帝视角
export const viewModeNames = ['第一人称', '第三人称', '上帝视角']

// ─── 纯 JS 可变状态（高频读写，不用 ref 避免 .value 开销） ───
export const state = {
    // ── Three.js 核心对象 ──
    scene: null,
    camera: null,
    renderer: null,
    clock: null,

    // ── 玩家 ──
    player: null,               // THREE.Group（模型容器）
    mixer: null,                // THREE.AnimationMixer
    walkAction: null,           // 行走 AnimationAction
    currentAnim: 'idle',        // 'idle' | 'walk'

    // ── 转向 ──
    isTurning: false,
    turnStartAngle: 0,
    turnTargetAngle: 0,
    turnTotalTime: 0,
    turnTimer: 0,

    // ── 移动输入 ──
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    sprinting: false,
    velocityX: 0,
    velocityZ: 0,

    // ── 相机控制 ──
    cameraPitch: 0.45,          // 俯仰角（弧度）
    cameraDistance: 5.5,        // 第三人称距离
    godHeight: 20,              // 上帝视角高度
    isOrbiting: false,          // 右键拖拽旋转中
    isPointerLocked: false,     // 指针锁定中

    // ── 迷宫数据 ──
    maze: [],                   // 二维数组 0=路 1=墙
    endPos: null,               // 终点世界坐标 { x, z }
    gameWon: false,

    // ── 场景资源引用 ──
    wallMeshes: [],             // 所有墙壁 Mesh（射线检测用）
    cloudGroups: [],            // 云朵 Group 数组
    minimapCtx: null,           // 小地图 Canvas 2D 上下文
}
