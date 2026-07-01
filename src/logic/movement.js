// ══════════════════════════════════════════════
//  src/logic/movement.js
//  移动更新 / 碰撞检测 / 自动转向 / 动画状态机
// ══════════════════════════════════════════════

import * as THREE from 'three'
import {
    CELL_SIZE, PLAYER_RADIUS,
    MAX_WALK_SPEED, MAX_SPRINT_SPEED,
    ACCELERATION, FRICTION, TURN_DURATION,
} from './constants.js'
import { state, viewMode } from './state.js'

// ══════════════════════════════════════════════
//  碰撞检测
// ══════════════════════════════════════════════
/**
 * 检查 (x, z) 位置是否与墙壁相交
 * @returns {boolean} true=可通过
 */
export function canMove(x, z) {
    const r = PLAYER_RADIUS
    for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) {
        const gx = Math.floor((x + dx) / CELL_SIZE)
        const gz = Math.floor((z + dz) / CELL_SIZE)
        if (gz < 0 || gz >= state.maze.length || gx < 0 || gx >= state.maze[gz].length) return false
        if (state.maze[gz][gx] === 1) return false
    }
    return true
}

// ══════════════════════════════════════════════
//  移动更新
// ══════════════════════════════════════════════
export function updateMovement(delta) {
    if (!state.player || state.isTurning) return
    const targetSpeed = state.sprinting ? MAX_SPRINT_SPEED : MAX_WALK_SPEED

    // WASD 永远基于玩家朝向（前进 = -Z 方向）
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.rotation.y)
    const right = new THREE.Vector3(1, 0, 0)
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.rotation.y)

    const inputDir = new THREE.Vector3()
    if (state.moveForward) inputDir.add(forward)
    if (state.moveBackward) inputDir.sub(forward)
    if (state.moveRight) inputDir.add(right)
    if (state.moveLeft) inputDir.sub(right)

    if (inputDir.length() > 0) {
        inputDir.normalize()

        // 第三人称 / 上帝视角：自动旋转角色朝向输入方向
        if (viewMode.value !== 0) {
            const facingDir = new THREE.Vector3(0, 0, -1)
            facingDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.rotation.y)

            // 有符号夹角（正=右转，负=左转）
            const crossY = facingDir.x * inputDir.z - facingDir.z * inputDir.x
            const dot = facingDir.x * inputDir.x + facingDir.z * inputDir.z
            const angleDiff = -Math.atan2(crossY, dot)

            // 大幅转向 → 触发原地旋转动画
            if (Math.abs(angleDiff) > 0.85) {
                triggerTurn(angleDiff)
                return
            }
            // 小幅修正 → 平滑旋转
            state.player.rotation.y += angleDiff * Math.min(1, 10 * delta)
        }

        // 指数平滑加速
        const tvx = inputDir.x * targetSpeed
        const tvz = inputDir.z * targetSpeed
        const t = 1.0 - Math.exp(-ACCELERATION * delta)
        state.velocityX += (tvx - state.velocityX) * t
        state.velocityZ += (tvz - state.velocityZ) * t

    } else {
        // 无输入 → 摩擦力衰减
        const decay = Math.exp(-FRICTION * delta)
        state.velocityX *= decay
        state.velocityZ *= decay
    }

    // 静止阈值
    if (Math.abs(state.velocityX) < 0.005) state.velocityX = 0
    if (Math.abs(state.velocityZ) < 0.005) state.velocityZ = 0

    // 碰撞后分离移动
    const px = state.player.position.x, pz = state.player.position.z
    const nx = px + state.velocityX * delta, nz = pz + state.velocityZ * delta
    if (canMove(nx, pz)) state.player.position.x = nx
    if (canMove(px, nz)) state.player.position.z = nz

    // 终点判定
    if (state.endPos && !state.gameWon) {
        if (Math.hypot(state.player.position.x - state.endPos.x,
                       state.player.position.z - state.endPos.z) < 0.45) {
            state.gameWon = true
            alert('🎉 恭喜！你找到终点了！')
            location.reload()
        }
    }
}

// ══════════════════════════════════════════════
//  自动转向（原地旋转，不移动）
// ══════════════════════════════════════════════
export function triggerTurn(angleChange) {
    if (!state.player || state.isTurning) return
    state.isTurning = true
    state.turnTimer = 0
    state.turnStartAngle = state.player.rotation.y
    state.turnTargetAngle = state.player.rotation.y + angleChange
    state.turnTotalTime = Math.abs(angleChange) / (Math.PI / 2) * TURN_DURATION
}

// ══════════════════════════════════════════════
//  转向更新
// ══════════════════════════════════════════════
export function updateTurning(delta) {
    if (!state.isTurning || !state.player) return
    state.turnTimer += delta
    state.mixer?.update(delta)

    // ease-out 平滑旋转
    const progress = Math.min(1, state.turnTimer / state.turnTotalTime)
    const eased = 1 - Math.pow(1 - progress, 2)
    state.player.rotation.y =
        state.turnStartAngle + (state.turnTargetAngle - state.turnStartAngle) * eased

    if (progress >= 1) {
        // 归一化角度到 [-PI, PI]
        let ry = state.turnTargetAngle % (Math.PI * 2)
        if (ry > Math.PI) ry -= Math.PI * 2
        else if (ry < -Math.PI) ry += Math.PI * 2
        state.player.rotation.y = ry
        state.isTurning = false
        state.turnTimer = 0
    }
}

// ══════════════════════════════════════════════
//  动画状态机（行走 / 静止）
// ══════════════════════════════════════════════
export function updateAnimation(delta) {
    if (!state.mixer) return
    state.mixer.update(delta)

    if (state.isTurning) return

    const speed = Math.sqrt(state.velocityX ** 2 + state.velocityZ ** 2)
    const moving = speed > 0.25

    if (moving && state.currentAnim !== 'walk') {
        // 开始行走 — 从头播放并循环
        state.walkAction?.reset().play()
        state.currentAnim = 'walk'
    } else if (!moving && state.currentAnim !== 'idle') {
        // 停止 — 停掉动画
        state.walkAction?.stop()
        state.currentAnim = 'idle'
    }
}
