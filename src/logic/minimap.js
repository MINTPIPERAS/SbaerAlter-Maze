// ══════════════════════════════════════════════
//  src/logic/minimap.js
//  小地图绘制
// ══════════════════════════════════════════════

import { CELL_SIZE } from './constants.js'
import { state } from './state.js'

/**
 * 初始化小地图 Canvas 尺寸与 2D 上下文
 * @param {HTMLCanvasElement} canvas
 */
export function setupMinimap(canvas) {
    if (!canvas) return
    canvas.width = 190
    canvas.height = 190
    state.minimapCtx = canvas.getContext('2d')
}

/**
 * 在 Canvas 上绘制迷宫俯视图
 * @param {HTMLCanvasElement} canvas - 小地图 Canvas 元素
 */
export function drawMinimap(canvas) {
    if (!state.minimapCtx || !state.player || !canvas) return

    const cellSize = canvas.width / state.maze[0].length

    // 背景
    state.minimapCtx.fillStyle = '#ffffff'
    state.minimapCtx.fillRect(0, 0, canvas.width, canvas.height)

    // 格子
    state.maze.forEach((row, z) => {
        row.forEach((cell, x) => {
            state.minimapCtx.fillStyle = cell === 1 ? '#9b8e7a' : '#f0f0f0'
            state.minimapCtx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize)
            state.minimapCtx.strokeStyle = '#ddd'
            state.minimapCtx.strokeRect(x * cellSize, z * cellSize, cellSize, cellSize)
        })
    })

    // 终点标记（红色方块）
    if (state.endPos) {
        state.minimapCtx.fillStyle = '#ff6b6b'
        const egx = state.endPos.x / CELL_SIZE - 0.5
        const egz = state.endPos.z / CELL_SIZE - 0.5
        state.minimapCtx.fillRect(egx * cellSize - 3, egz * cellSize - 3, 6, 6)
    }

    // 玩家位置（蓝色圆点）
    const pgx = state.player.position.x / CELL_SIZE - 0.5
    const pgz = state.player.position.z / CELL_SIZE - 0.5
    state.minimapCtx.fillStyle = '#2196f3'
    state.minimapCtx.beginPath()
    state.minimapCtx.arc(pgx * cellSize, pgz * cellSize, 4, 0, Math.PI * 2)
    state.minimapCtx.fill()
}
