// ══════════════════════════════════════════════
//  src/logic/loop.js
//  主循环（requestAnimationFrame）
// ══════════════════════════════════════════════

import { state } from './state.js'
import { updateMovement, updateTurning, updateAnimation } from './movement.js'
import { updateCamera } from './camera.js'
import { drawMinimap } from './minimap.js'

/**
 * 启动游戏主循环。每帧依次：输入处理 → 动画 → 相机 → 小地图 → 渲染
 * @param {HTMLCanvasElement} minimapCanvas - 小地图 Canvas（用于绘制）
 */
export function animate(minimapCanvas) {
    requestAnimationFrame(() => animate(minimapCanvas))

    const delta = Math.min(state.clock.getDelta(), 0.1)

    // 移动（转向优先）
    if (state.isTurning) {
        updateTurning(delta)
    } else {
        updateMovement(delta)
    }

    updateAnimation(delta)
    updateCamera(delta)

    // 小地图
    if (minimapCanvas) drawMinimap(minimapCanvas)

    // 云朵缓慢旋转
    const now = performance.now() * 0.001
    state.cloudGroups.forEach((group, i) => {
        group.rotation.y = now * 0.015 * (i % 2 === 0 ? 1 : -1)
    })

    state.renderer.render(state.scene, state.camera)
}
