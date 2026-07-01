// ══════════════════════════════════════════════
//  src/logic/camera.js
//  三种视角模式的相机更新
// ══════════════════════════════════════════════

import * as THREE from 'three'
import { CELL_SIZE, MAZE_ROWS, MAZE_COLS } from './constants.js'
import { state, viewMode } from './state.js'

/**
 * 每帧更新相机位置与朝向
 */
export function updateCamera(delta) {
    if (!state.player || !state.camera) return

    // 模型可见性：第一人称隐藏模型本体（避免看到眼睛内部）
    state.player.visible = viewMode.value !== 0

    if (viewMode.value === 0) {
        // ── 第一人称：固定在玩家眼睛高度 ──
        state.camera.position.set(
            state.player.position.x,
            state.player.position.y + 1.55,
            state.player.position.z
        )
        state.camera.rotation.order = 'YXZ'
        state.camera.rotation.y = state.player.rotation.y
        state.camera.rotation.x = state.cameraPitch

    } else if (viewMode.value === 1) {
        // ── 第三人称：摄像机在角色后上方向下看 ──
        const behindYaw = state.player.rotation.y
        const horizDist = state.cameraDistance * Math.cos(state.cameraPitch)
        const vertOffset = 1.5 + state.cameraDistance * Math.sin(state.cameraPitch)

        // 1. 理想机位（背后+上方）
        // 前进方向 = (-sinθ, 0, -cosθ)，背后 = (+sinθ, 0, +cosθ)
        const ideal = new THREE.Vector3(
            state.player.position.x + Math.sin(behindYaw) * horizDist,
            state.player.position.y + vertOffset,
            state.player.position.z + Math.cos(behindYaw) * horizDist
        )

        // 2. 前向射线：玩家 → 理想机位，防止相机穿墙
        const origin = new THREE.Vector3(
            state.player.position.x, state.player.position.y + 1.2, state.player.position.z
        )
        const toCamera = ideal.clone().sub(origin)
        const dist = toCamera.length()
        if (dist > 0.01) {
            toCamera.normalize()
            const forwardHit = new THREE.Raycaster(
                origin, toCamera, 0, dist
            ).intersectObjects(state.wallMeshes)
            if (forwardHit.length > 0) {
                const blockedDist = Math.max(2.0, forwardHit[0].distance - 0.4)
                ideal.copy(origin.clone().add(toCamera.clone().multiplyScalar(blockedDist)))
            }
        }

        // 3. 反向校验：相机 → 玩家，确保视线无遮挡
        const camToPlayer = origin.clone().sub(ideal)
        const checkDist = camToPlayer.length()
        if (checkDist > 0.01) {
            camToPlayer.normalize()
            const reverseHit = new THREE.Raycaster(
                ideal, camToPlayer, 0, checkDist
            ).intersectObjects(state.wallMeshes)
            if (reverseHit.length > 0) {
                // 视线被墙挡住 → 拉近到安全距离
                const safeDist = 2.0
                ideal.copy(origin.clone().add(
                    new THREE.Vector3(
                        Math.sin(behindYaw) * safeDist,
                        safeDist * 0.6,
                        Math.cos(behindYaw) * safeDist
                    )
                ))
            }
        }

        // 4. 转身时瞬间定位，平时平滑跟随
        const lerpFactor = state.isTurning ? 1.0 : (1 - Math.exp(-10 * delta))
        state.camera.position.lerp(ideal, lerpFactor)
        state.camera.lookAt(
            state.player.position.x,
            state.player.position.y + 1.15,
            state.player.position.z
        )

    } else if (viewMode.value === 2) {
        // ── 上帝视角：迷宫正上方俯视 ──
        const cx = ((MAZE_COLS - 1) / 2 + 0.5) * CELL_SIZE
        const cz = ((MAZE_ROWS - 1) / 2 + 0.5) * CELL_SIZE
        const target = new THREE.Vector3(cx, state.godHeight, cz + 0.1)
        state.camera.position.lerp(target, 0.08)
        state.camera.lookAt(cx, 0, cz)
    }
}
