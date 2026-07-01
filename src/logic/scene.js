// ══════════════════════════════════════════════
//  src/logic/scene.js
//  Three.js 场景初始化（光照 / 地面 / 墙壁 / 云朵 / 标记）
// ══════════════════════════════════════════════

import * as THREE from 'three'
import { CELL_SIZE, WALL_HEIGHT, MAZE_ROWS, MAZE_COLS, START_CELL } from './constants.js'
import { state } from './state.js'
import { generateMaze } from './maze.js'
import { generateStoneTexture, generateBumpTexture, generateFloorTexture } from './textures.js'

/**
 * 主入口：构建完整 Three.js 场景
 * @param {HTMLElement} container - 游戏容器 DOM 元素
 */
export function initScene(container) {
    // ── 1. 迷宫数据 ──
    const generated = generateMaze(MAZE_ROWS, MAZE_COLS)
    state.maze = generated.maze
    const END_CELL = generated.endCell

    // ── 2. 场景 / 相机 / 渲染器 ──
    state.scene = new THREE.Scene()

    // 天空球
    const skyGeo = new THREE.SphereGeometry(45, 32, 32)
    const skyColors = []
    const positions = skyGeo.attributes.position
    const topColor = new THREE.Color(0x7eb8da)
    const horizonColor = new THREE.Color(0xd0d9e0)
    for (let i = 0; i < positions.count; i++) {
        const t = THREE.MathUtils.clamp((positions.getY(i) + 45) / 90, 0, 1)
        const c = new THREE.Color().copy(horizonColor).lerp(topColor, t)
        skyColors.push(c.r, c.g, c.b)
    }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3))
    state.scene.add(new THREE.Mesh(skyGeo,
        new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))
    state.scene.fog = new THREE.Fog(0xd0d9e0, 10, 58)

    const width = container.clientWidth
    const height = container.clientHeight
    state.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)

    state.renderer = new THREE.WebGLRenderer({ antialias: true })
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    state.renderer.setSize(width, height)
    state.renderer.outputColorSpace = THREE.SRGBColorSpace
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping
    state.renderer.toneMappingExposure = 1.15
    state.renderer.physicallyCorrectLights = true
    state.renderer.shadowMap.enabled = true
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(state.renderer.domElement)

    state.clock = new THREE.Clock()

    // 窗口大小自适应
    window.addEventListener('resize', () => {
        state.camera.aspect = container.clientWidth / container.clientHeight
        state.camera.updateProjectionMatrix()
        state.renderer.setSize(container.clientWidth, container.clientHeight)
    })

    // ── 3. 迷宫在场景中的尺寸（供光照、地板共用） ──
    const mazeTotalW = MAZE_COLS * CELL_SIZE   // 迷宫总宽（世界单位）
    const mazeTotalD = MAZE_ROWS * CELL_SIZE   // 迷宫总深
    const mazeCenterX = mazeTotalW / 2
    const mazeCenterZ = mazeTotalD / 2
    const floorW = mazeTotalW + CELL_SIZE * 2  // 左右各留一格边距
    const floorD = mazeTotalD + CELL_SIZE * 2  // 上下各留一格边距

    // ── 4. 光照 ──
    state.scene.add(new THREE.HemisphereLight(0xeaf3ff, 0x8f9aa8, 1.0))

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(mazeCenterX + 8, 14, mazeCenterZ + 6)
    keyLight.target.position.set(mazeCenterX, 0, mazeCenterZ)
    state.scene.add(keyLight.target)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 80
    keyLight.shadow.camera.left = -28
    keyLight.shadow.camera.right = 28
    keyLight.shadow.camera.top = 28
    keyLight.shadow.camera.bottom = -28
    keyLight.shadow.bias = -0.00015
    keyLight.shadow.normalBias = 0.02
    state.scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xcfe3ff, 0.45)
    fillLight.position.set(-6, 5, -7)
    state.scene.add(fillLight)

    // ── 5. 地面（动态尺寸 + 石砖纹理） ──

    const floorTex = generateFloorTexture()
    // 纹理 repeat 使每块石砖约 1 单位宽
    floorTex.repeat.set(floorW / 7, floorD / 7)

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(floorW, floorD),
        new THREE.MeshStandardMaterial({
            map: floorTex, roughness: 0.78, metalness: 0.02,
        })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(mazeCenterX, 0, mazeCenterZ)
    floor.receiveShadow = true
    state.scene.add(floor)

    // ── 6. 城堡石墙 ──
    const stoneTex = generateStoneTexture()
    stoneTex.repeat.set(1, WALL_HEIGHT / CELL_SIZE)  // 根据墙高调整贴图重复

    const bumpTex = generateBumpTexture()
    bumpTex.repeat.set(1, WALL_HEIGHT / CELL_SIZE)

    const wallGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE)
    const wallMat = new THREE.MeshStandardMaterial({
        map: stoneTex, bumpMap: bumpTex, bumpScale: 0.04,
        roughness: 0.72, metalness: 0.03,
    })

    state.wallMeshes = []
    state.maze.forEach((row, z) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const wall = new THREE.Mesh(wallGeo, wallMat)
                wall.position.set((x + 0.5) * CELL_SIZE, WALL_HEIGHT / 2, (z + 0.5) * CELL_SIZE)
                wall.castShadow = true
                wall.receiveShadow = true
                state.scene.add(wall)
                state.wallMeshes.push(wall)
            }
        })
    })

    // ── 7. 云朵 ──
    state.cloudGroups = []
    const cloudTexCanvas = document.createElement('canvas')
    cloudTexCanvas.width = 128
    cloudTexCanvas.height = 128
    const cCtx = cloudTexCanvas.getContext('2d')
    const rg = cCtx.createRadialGradient(64, 52, 8, 64, 64, 64)
    rg.addColorStop(0, 'rgba(255,255,255,1)')
    rg.addColorStop(0.4, 'rgba(252,252,255,0.95)')
    rg.addColorStop(0.7, 'rgba(235,237,245,0.75)')
    rg.addColorStop(0.88, 'rgba(210,215,228,0.45)')
    rg.addColorStop(1, 'rgba(195,200,215,0)')
    cCtx.fillStyle = rg
    cCtx.fillRect(0, 0, 128, 128)
    const cloudTex = new THREE.CanvasTexture(cloudTexCanvas)
    const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTex, roughness: 0.85, metalness: 0.0,
        transparent: true, alphaTest: 0.05, depthWrite: false,
        emissive: 0x222233, emissiveIntensity: 0.08,
    })

    const cloudDefs = [
        { cx: -18, cy: 29, cz: -14, count: 22, spread: 6.0 },
        { cx: 12, cy: 31, cz: -16, count: 20, spread: 6.5 },
        { cx: -10, cy: 27, cz: 14, count: 18, spread: 5.5 },
        { cx: 18, cy: 33, cz: 10, count: 24, spread: 6.0 },
        { cx: -20, cy: 30, cz: -6, count: 19, spread: 5.8 },
        { cx: 7, cy: 26, cz: -10, count: 16, spread: 5.0 },
        { cx: -14, cy: 34, cz: 5, count: 21, spread: 6.2 },
        { cx: 22, cy: 28, cz: -3, count: 17, spread: 5.2 },
        { cx: -6, cy: 25, cz: -18, count: 15, spread: 4.8 },
        { cx: 15, cy: 35, cz: 15, count: 20, spread: 5.5 },
    ]
    cloudDefs.forEach(({ cx, cy, cz, count, spread }) => {
        const group = new THREE.Group()
        for (let i = 0; i < count; i++) {
            const puff = new THREE.Mesh(
                new THREE.SphereGeometry(0.6 + Math.random() * 2.4, 8, 6),
                cloudMat
            )
            puff.position.set(
                (Math.random() - 0.5) * spread * 2.2,
                (Math.random() - 0.5) * spread * 0.35,
                (Math.random() - 0.5) * spread * 1.2
            )
            puff.scale.set(1, 0.35 + Math.random() * 0.35, 1)
            group.add(puff)
        }
        group.position.set(cx, cy, cz)
        state.scene.add(group)
        state.cloudGroups.push(group)
    })

    // ── 8. 起点标记（蓝色） ──
    const startMarker = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.08, 0.82),
        new THREE.MeshStandardMaterial({ color: 0x2196f3 })
    )
    startMarker.position.set((START_CELL.x + 0.5) * CELL_SIZE, 0.04, (START_CELL.z + 0.5) * CELL_SIZE)
    startMarker.castShadow = true
    startMarker.receiveShadow = true
    state.scene.add(startMarker)

    // ── 9. 终点标记（红色发光） ──
    const endX = (END_CELL.x + 0.5) * CELL_SIZE
    const endZ = (END_CELL.z + 0.5) * CELL_SIZE
    state.endPos = { x: endX, z: endZ }

    const endMarker = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.08, 0.82),
        new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0xff6b6b, emissiveIntensity: 0.6 })
    )
    endMarker.position.set(endX, 0.04, endZ)
    endMarker.castShadow = true
    endMarker.receiveShadow = true
    state.scene.add(endMarker)

    const endLight = new THREE.PointLight(0xff6b6b, 1.7, 4)
    endLight.position.set(endX, 0.5, endZ)
    state.scene.add(endLight)
}
