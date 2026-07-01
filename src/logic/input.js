// ══════════════════════════════════════════════
//  src/logic/input.js
//  键盘 / 鼠标 / 滚轮输入处理 + 视角切换
// ══════════════════════════════════════════════

import { state, viewMode } from './state.js'

// ─── 保存监听器引用，用于清理 ───
let _onKeyDown, _onKeyUp, _onMouseDown, _onMouseMove, _onMouseUp, _onWheel, _onPointerLockChange

// ══════════════════════════════════════════════
//  键盘
// ══════════════════════════════════════════════
function onKeyDown(e) {
    if (e.code === 'KeyW') state.moveForward = true
    if (e.code === 'KeyS') state.moveBackward = true
    if (e.code === 'KeyA') state.moveLeft = true
    if (e.code === 'KeyD') state.moveRight = true
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprinting = true
    if (e.code === 'KeyV') toggleView()
}

function onKeyUp(e) {
    if (e.code === 'KeyW') state.moveForward = false
    if (e.code === 'KeyS') state.moveBackward = false
    if (e.code === 'KeyA') state.moveLeft = false
    if (e.code === 'KeyD') state.moveRight = false
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprinting = false
}

// ══════════════════════════════════════════════
//  视角切换
// ══════════════════════════════════════════════
function toggleView() {
    viewMode.value = (viewMode.value + 1) % 3
    if (viewMode.value === 0 || viewMode.value === 1) {
        // 第一 / 第三人称 → 请求指针锁定
        _container?.requestPointerLock()
    } else {
        // 上帝视角 → 释放指针
        if (document.pointerLockElement) document.exitPointerLock()
    }
    // 重置俯仰角
    state.cameraPitch = 0.4
}

function onPointerLockChange() {
    state.isPointerLocked = document.pointerLockElement === _container
    if (!state.isPointerLocked && (viewMode.value === 0 || viewMode.value === 1)) {
        // 第一/第三人称下 ESC 解锁 → 自动切到上帝视角
        viewMode.value = 2
    }
}

// ══════════════════════════════════════════════
//  鼠标
// ══════════════════════════════════════════════
function onMouseDown(e) {
    if (viewMode.value === 0 || viewMode.value === 1) {
        _container?.requestPointerLock()
    } else if (e.button === 2) {
        state.isOrbiting = true
    }
}

function onMouseMove(e) {
    // 第一/第三人称：指针锁定下旋转视角
    if (state.isPointerLocked && (viewMode.value === 0 || viewMode.value === 1)) {
        const sensitivity = 0.002
        state.player.rotation.y -= e.movementX * sensitivity
        state.cameraPitch -= e.movementY * sensitivity
        state.cameraPitch = Math.max(-1.2, Math.min(1.2, state.cameraPitch))
    }
    // 上帝视角：右键拖拽旋转
    if (state.isOrbiting && viewMode.value === 2 && state.player) {
        state.player.rotation.y -= e.movementX * 0.005
    }
}

function onMouseUp(e) {
    if (e.button === 2) state.isOrbiting = false
}

// ══════════════════════════════════════════════
//  滚轮
// ══════════════════════════════════════════════
function onWheel(e) {
    if (viewMode.value === 1) {
        state.cameraDistance = Math.max(2.5, Math.min(10, state.cameraDistance + e.deltaY * 0.01))
    } else if (viewMode.value === 2) {
        state.godHeight = Math.max(8, Math.min(35, state.godHeight - e.deltaY * 0.03))
    }
}

// ══════════════════════════════════════════════
//  监听器生命周期
// ══════════════════════════════════════════════
let _container = null

/** 注册所有输入事件监听 */
export function setupInputListeners(container) {
    _container = container

    _onKeyDown = onKeyDown
    _onKeyUp = onKeyUp
    _onMouseDown = onMouseDown
    _onMouseMove = onMouseMove
    _onMouseUp = onMouseUp
    _onWheel = onWheel
    _onPointerLockChange = onPointerLockChange

    document.addEventListener('keydown', _onKeyDown)
    document.addEventListener('keyup', _onKeyUp)
    container.addEventListener('mousedown', _onMouseDown)
    document.addEventListener('mousemove', _onMouseMove)
    document.addEventListener('mouseup', _onMouseUp)
    container.addEventListener('wheel', _onWheel)
    document.addEventListener('pointerlockchange', _onPointerLockChange)

    // 屏蔽游戏容器内右键菜单
    window.addEventListener('contextmenu', _preventContextMenu)
}

function _preventContextMenu(e) {
    if (e.target.closest('.game-container')) e.preventDefault()
}

/** 移除所有输入事件监听 */
export function removeInputListeners() {
    if (_onKeyDown) document.removeEventListener('keydown', _onKeyDown)
    if (_onKeyUp) document.removeEventListener('keyup', _onKeyUp)
    if (_onMouseMove) document.removeEventListener('mousemove', _onMouseMove)
    if (_onMouseUp) document.removeEventListener('mouseup', _onMouseUp)
    if (_onPointerLockChange) document.removeEventListener('pointerlockchange', _onPointerLockChange)
    // mousedown/wheel 绑定在 container 上，由 DOM 移除自动清理
    window.removeEventListener('contextmenu', _preventContextMenu)
}
