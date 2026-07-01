// ══════════════════════════════════════════════
//  src/logic/character.js
//  FBX 角色加载与初始化
// ══════════════════════════════════════════════

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { CELL_SIZE, START_CELL } from './constants.js'
import { state, characterReady } from './state.js'

/**
 * 异步加载 Alter-Walk.fbx 并初始化玩家模型
 * 模型放入 Group 容器，自动缩放，绑定贴图与行走动画
 */
export async function loadCharacter() {
    const fbxLoader = new FBXLoader()

    try {
        const model = await new Promise((resolve, reject) => {
            fbxLoader.load('/character/Alter-Walk.fbx', resolve, undefined, reject)
        })

        // ── 容器：解耦视觉朝向与移动朝向 ──
        const playerGroup = new THREE.Group()
        // 模型默认面朝 +Z，旋转 180° 使视觉正面朝 -Z（= 容器前进方向）
        model.rotation.y = Math.PI
        playerGroup.add(model)

        // ── 自动缩放：包围盒 → 目标身高 ~1.7 单位 ──
        const box = new THREE.Box3().setFromObject(model)
        const modelHeight = box.max.y - box.min.y
        const TARGET_HEIGHT = 1.7
        const autoScale = modelHeight > 0.001 ? TARGET_HEIGHT / modelHeight : 0.011
        console.log(
            `[Alter-Walk] 原始高度: ${modelHeight.toFixed(2)}, ` +
            `自动缩放: ${autoScale.toFixed(4)}, ` +
            `动画片段: ${model.animations.length} 个`
        )

        state.player = playerGroup
        state.player.scale.setScalar(autoScale)
        state.player.position.set(
            (START_CELL.x + 0.5) * CELL_SIZE, 0,
            (START_CELL.z + 0.5) * CELL_SIZE
        )

        // ── 阴影 + 贴图 + 材质修正 ──
        const textureLoader = new THREE.TextureLoader()
        const charTexture = textureLoader.load('/character/textures/Padoru_alter.png')

        state.player.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material]
                    materials.forEach(mat => {
                        // 确保材质可见
                        mat.transparent = false
                        mat.opacity = 1
                        mat.colorWrite = true
                        mat.depthWrite = true
                        // 无贴图或贴图无效 → 手动绑定
                        if (!mat.map || !mat.map.image) {
                            mat.map = charTexture
                            mat.color.set(0xffffff)
                        }
                        mat.needsUpdate = true
                    })
                }
            }
        })

        // ── 动画混合器（根为 Group，遍历子骨骼） ──
        state.mixer = new THREE.AnimationMixer(state.player)

        if (model.animations.length > 0) {
            state.walkAction = state.mixer.clipAction(model.animations[0])
            state.walkAction.setLoop(THREE.LoopRepeat)
            model.animations.forEach((clip, i) => {
                console.log(`  [${i}] ${clip.name} (${clip.duration.toFixed(2)}s)`)
            })
        }

        state.scene.add(state.player)
        characterReady.value = true

    } catch (err) {
        console.error('FBX 加载失败:', err)
        // 降级：蓝色方块占位
        state.player = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 1.6, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x4488cc })
        )
        state.player.position.set(
            (START_CELL.x + 0.5) * CELL_SIZE, 0.8,
            (START_CELL.z + 0.5) * CELL_SIZE
        )
        state.player.castShadow = true
        state.scene.add(state.player)
        characterReady.value = true
    }
}
