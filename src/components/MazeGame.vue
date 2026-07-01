<template>
    <div class="wrapper">
        <!-- FBX 加载中遮罩 -->
        <div v-if="!characterReady" class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-text">模型加载中...</div>
        </div>
        <div class="game-frame">
            <div ref="container" class="game-container"></div>
        </div>
        <div class="hint-panel">
            <span class="hint-icon">⚔️</span>
            <span>WASD 移动(相对朝向) · Shift 跑 · V 切视角({{ viewModeNames[viewMode] }}){{ viewMode === 0 ? ' · 移动鼠标转头 · ESC 退出' : viewMode === 1 ? ' · 移动鼠标转头 · 滚轮调节距离 · ESC 退出' : ' · 右键拖拽旋转 · 滚轮调高度' }}</span>
        </div>
        <!-- 视角指示器 -->
        <div class="view-badge" :class="'mode-' + viewMode">
            {{ viewModeNames[viewMode] }}
        </div>
        <div class="minimap-panel">
            <div class="minimap-title">地图</div>
            <canvas ref="minimapCanvas" class="minimap"></canvas>
        </div>
    </div>
</template>

<script setup>
// ══════════════════════════════════════════════
//  MazeGame.vue — 迷宫游戏主组件
//  所有游戏逻辑已拆分至 src/logic/ 模块
// ══════════════════════════════════════════════

import { onMounted, onUnmounted, ref } from 'vue'
import { characterReady, viewMode, viewModeNames } from '../logic/state.js'
import { initScene } from '../logic/scene.js'
import { loadCharacter } from '../logic/character.js'
import { setupInputListeners, removeInputListeners } from '../logic/input.js'
import { setupMinimap } from '../logic/minimap.js'
import { animate } from '../logic/loop.js'

// ─── 模板 ref ───
const container = ref(null)
const minimapCanvas = ref(null)

onMounted(async () => {
    initScene(container.value)                       // 1. Three.js 场景搭建
    setupInputListeners(container.value)             // 2. 注册键盘/鼠标事件
    setupMinimap(minimapCanvas.value)                // 3. 初始化小地图
    await loadCharacter()                            // 4. 异步加载角色模型
    animate(minimapCanvas.value)                     // 5. 启动主循环
})

onUnmounted(() => {
    removeInputListeners()
})
</script>

<style>
/* ─── 外层容器 ─── */
.wrapper {
    display: flex; flex-direction: column; align-items: center; gap: 18px;
    position: relative; z-index: 1;
}

/* ─── 模型加载遮罩 ─── */
.loading-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(10, 10, 18, 0.85);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 20px;
}
.loading-spinner {
    width: 48px; height: 48px;
    border: 4px solid rgba(180, 150, 110, 0.3);
    border-top-color: #c8a86a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
    color: #d6ccba; font-size: 16px; letter-spacing: 1px;
}

/* ─── 城堡石框 ─── */
.game-frame {
    position: relative;
    border: 3px solid #5a4e3c; border-radius: 10px;
    box-shadow: 0 0 0 7px #322a1e, 0 0 0 11px #6b5d46, 0 0 0 14px #1f1a12,
                0 10px 48px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.18);
    overflow: hidden; line-height: 0;
}
.game-container {
    width: min(1200px, 95vw); height: min(780px, 86vh);
    position: relative; display: block;
}

/* ─── 视角指示器 ─── */
.view-badge {
    position: fixed; top: 22px; left: 22px; z-index: 100;
    padding: 7px 16px;
    background: rgba(22,20,30,0.82); backdrop-filter: blur(10px);
    border: 1px solid rgba(180,152,118,0.4); border-radius: 20px;
    color: #c8b898; font-size: 13px; font-weight: 600;
    letter-spacing: 1px; user-select: none;
    box-shadow: 0 3px 16px rgba(0,0,0,0.4);
}
.view-badge.mode-0 {
    border-color: rgba(130,180,220,0.5); color: #8abcdd;
}
.view-badge.mode-2 {
    border-color: rgba(200,180,130,0.5); color: #d4c090;
}

/* ─── 小地图面板 ─── */
.minimap-panel {
    position: fixed; top: 22px; right: 22px; z-index: 100;
    background: linear-gradient(145deg, #f7f2e6, #e8dfc8);
    border: 3px solid #8b7658; border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 22px rgba(0,0,0,0.55), inset 0 0 18px rgba(139,119,88,0.12);
    line-height: 1.4;
}
.minimap-title {
    font-size: 14px; font-weight: 700; color: #5a4530;
    text-align: center; margin-bottom: 8px; letter-spacing: 2px;
    text-transform: uppercase; font-family: "Georgia","Times New Roman",serif;
}
.minimap {
    display: block; border: 1px solid #b8a080; background: #fff;
    box-shadow: inset 0 0 4px rgba(0,0,0,0.08);
}

/* ─── 操作提示 ─── */
.hint-panel {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 30px;
    background: rgba(22,20,30,0.80); backdrop-filter: blur(14px);
    border: 1px solid rgba(180,152,118,0.35); border-radius: 30px;
    color: #d6ccba; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;
    box-shadow: 0 4px 26px rgba(0,0,0,0.45), 0 0 34px rgba(170,140,100,0.10);
    transition: all 0.35s ease; user-select: none;
}
.hint-panel:hover {
    border-color: rgba(200,168,128,0.55);
    box-shadow: 0 4px 30px rgba(0,0,0,0.5), 0 0 44px rgba(180,150,110,0.18);
    color: #e8dfce;
}
.hint-icon { font-size: 18px; filter: drop-shadow(0 0 4px rgba(200,160,100,0.4)); }
</style>
