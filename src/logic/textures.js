// ══════════════════════════════════════════════
//  src/logic/textures.js
//  程序化纹理生成（纯函数，返回 CanvasTexture）
// ══════════════════════════════════════════════

import * as THREE from 'three'

/**
 * 生成城堡石墙颜色贴图（512×512）
 * 含仿石砌图案、砂浆缝、渐变、裂纹、噪点与暗角
 */
export function generateStoneTexture() {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 砂浆底色
    ctx.fillStyle = '#8a8578'
    ctx.fillRect(0, 0, size, size)

    // 微妙颗粒噪点
    for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.04})`
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2)
    }

    const stoneH = 74, mortarW = 6
    const palette = [
        [182, 172, 156], [170, 160, 145], [190, 178, 162], [165, 155, 140],
        [176, 168, 152], [185, 170, 150], [172, 165, 148], [195, 182, 165],
    ]
    // 确定性伪随机（固定种子=42）
    const seeded = (() => {
        let s = 42
        return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
    })()

    // 逐行绘制石块
    for (let row = 0; row < Math.ceil(size / stoneH) + 1; row++) {
        const y = row * stoneH
        let x = row % 2 === 1 ? -(60 + seeded() * 50) : 0
        while (x < size + stoneH) {
            const sw = Math.max((70 + seeded() * 90) - mortarW * 2, 35)
            const sh = stoneH - mortarW * 2
            const sx = x + mortarW, sy = y + mortarW
            const [br, bg, bb] = palette[Math.floor(seeded() * palette.length)]
            const v = 14
            const r = Math.min(255, Math.max(0, br + (seeded() - 0.5) * v * 2))
            const g = Math.min(255, Math.max(0, bg + (seeded() - 0.5) * v * 2))
            const b = Math.min(255, Math.max(0, bb + (seeded() - 0.5) * v * 2))

            // 圆角石块
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.beginPath()
            const rad = 2.5
            ctx.moveTo(sx + rad, sy)
            ctx.lineTo(sx + sw - rad, sy)
            ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + rad)
            ctx.lineTo(sx + sw, sy + sh - rad)
            ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - rad, sy + sh)
            ctx.lineTo(sx + rad, sy + sh)
            ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - rad)
            ctx.lineTo(sx, sy + rad)
            ctx.quadraticCurveTo(sx, sy, sx + rad, sy)
            ctx.closePath()
            ctx.fill()

            // 垂直渐变（上亮下暗）
            const bg1 = ctx.createLinearGradient(sx, sy, sx, sy + sh)
            bg1.addColorStop(0, 'rgba(255,255,255,0.14)')
            bg1.addColorStop(0.15, 'rgba(255,255,255,0.06)')
            bg1.addColorStop(0.5, 'rgba(0,0,0,0)')
            bg1.addColorStop(0.75, 'rgba(0,0,0,0.04)')
            bg1.addColorStop(1, 'rgba(0,0,0,0.12)')
            ctx.fillStyle = bg1
            ctx.fillRect(sx + 2, sy + 1, sw - 4, sh - 2)

            // 水平渐变（左亮右暗）
            const bg2 = ctx.createLinearGradient(sx, sy, sx + sw, sy)
            bg2.addColorStop(0, 'rgba(255,255,255,0.05)')
            bg2.addColorStop(0.5, 'rgba(0,0,0,0)')
            bg2.addColorStop(1, 'rgba(0,0,0,0.05)')
            ctx.fillStyle = bg2
            ctx.fillRect(sx + 2, sy + 1, sw - 4, sh - 2)

            // 表面斑点
            for (let si = 0; si < 20; si++) {
                const a = 0.015 + seeded() * 0.04
                ctx.fillStyle = seeded() > 0.5
                    ? `rgba(255,255,255,${a})`
                    : `rgba(0,0,0,${a})`
                ctx.beginPath()
                ctx.arc(sx + seeded() * sw, sy + seeded() * sh, 0.8 + seeded() * 3, 0, Math.PI * 2)
                ctx.fill()
            }

            // 随机裂纹（概率 25%）
            if (seeded() < 0.25) {
                ctx.strokeStyle = 'rgba(0,0,0,0.07)'
                ctx.lineWidth = 1
                ctx.beginPath()
                const cx = sx + seeded() * sw * 0.7, cy = sy + seeded() * sh * 0.5
                ctx.moveTo(cx, cy)
                ctx.lineTo(cx + (seeded() - 0.5) * 18, cy + (seeded() - 0.3) * 20)
                ctx.stroke()
            }

            x += 70 + seeded() * 90
        }
    }

    // 全局噪点
    const id = ctx.getImageData(0, 0, size, size)
    for (let i = 0; i < id.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 9
        id.data[i] += n
        id.data[i + 1] += n
        id.data[i + 2] += n
    }
    ctx.putImageData(id, 0, 0)

    // 暗角
    const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.08)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

/**
 * 生成城堡石砖地板贴图（512×512）
 * 含交错石砖排列、砂浆缝、颜色变化、磨损与暗角
 */
export function generateFloorTexture() {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 砂浆底色
    ctx.fillStyle = '#7d796e'
    ctx.fillRect(0, 0, size, size)

    // 石砖色板
    const palette = [
        [148, 142, 130], [155, 148, 135], [140, 135, 125], [152, 145, 132],
        [145, 139, 128], [158, 150, 138], [142, 136, 124], [150, 143, 131],
    ]

    // 确定性伪随机（种子=99）
    const seeded = (() => {
        let s = 99
        return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
    })()

    const tileW = 72, tileH = 72, mortar = 5
    const cols = Math.ceil(size / tileW) + 1
    const rows = Math.ceil(size / tileH) + 1

    for (let row = 0; row < rows; row++) {
        const y = row * tileH
        // 奇数行偏移半块砖（交错排列）
        const offsetX = row % 2 === 1 ? tileW / 2 : 0
        for (let col = -1; col < cols; col++) {
            const x = col * tileW + offsetX
            const sx = x + mortar, sy = y + mortar
            const sw = tileW - mortar * 2, sh = tileH - mortar * 2

            // 跳过完全在画布外的砖块
            if (sx + sw < 0 || sx > size || sy + sh < 0 || sy > size) continue

            const [br, bg, bb] = palette[Math.floor(seeded() * palette.length)]
            const v = 16
            const r = Math.min(255, Math.max(0, br + (seeded() - 0.5) * v * 2))
            const g = Math.min(255, Math.max(0, bg + (seeded() - 0.5) * v * 2))
            const b = Math.min(255, Math.max(0, bb + (seeded() - 0.5) * v * 2))

            // 微圆角矩形
            ctx.fillStyle = `rgb(${r},${g},${b})`
            const rad = 3
            ctx.beginPath()
            ctx.moveTo(sx + rad, sy)
            ctx.lineTo(sx + sw - rad, sy)
            ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + rad)
            ctx.lineTo(sx + sw, sy + sh - rad)
            ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - rad, sy + sh)
            ctx.lineTo(sx + rad, sy + sh)
            ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - rad)
            ctx.lineTo(sx, sy + rad)
            ctx.quadraticCurveTo(sx, sy, sx + rad, sy)
            ctx.closePath()
            ctx.fill()

            // 轻微亮度随机变化（模拟磨损）
            const brightness = 0.82 + seeded() * 0.18
            ctx.fillStyle = `rgba(255,255,255,${(1 - brightness) * 0.5})`
            ctx.fillRect(sx + 1, sy, sw - 2, sh)

            // 少量表面斑点
            for (let si = 0; si < 8; si++) {
                const alpha = 0.01 + seeded() * 0.03
                ctx.fillStyle = seeded() > 0.55
                    ? `rgba(255,255,255,${alpha})`
                    : `rgba(0,0,0,${alpha})`
                ctx.beginPath()
                ctx.arc(sx + seeded() * sw, sy + seeded() * sh, 0.5 + seeded() * 2, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }

    // 全局细微噪点
    const imgData = ctx.getImageData(0, 0, size, size)
    for (let i = 0; i < imgData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 6
        imgData.data[i] += n
        imgData.data[i + 1] += n
        imgData.data[i + 2] += n
    }
    ctx.putImageData(imgData, 0, 0)

    // 边缘暗角（模拟长期踩踏中心磨损更亮）
    const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.72)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.12)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
}

/**
 * 生成对应的凹凸贴图（512×512，灰度高度）
 */
export function generateBumpTexture() {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#404040'
    ctx.fillRect(0, 0, size, size)

    const bumpSeeded = (() => {
        let s2 = 42
        return () => { s2 = (s2 * 16807) % 2147483647; return (s2 - 1) / 2147483646 }
    })()
    const bStoneH = 74, bMortar = 6

    for (let row = 0; row < Math.ceil(size / bStoneH) + 1; row++) {
        const y = row * bStoneH
        let x = row % 2 === 1 ? -(60 + bumpSeeded() * 50) : 0
        while (x < size + bStoneH) {
            const sw2 = Math.max((70 + bumpSeeded() * 90) - bMortar * 2, 35)
            const bright = 210 + bumpSeeded() * 45
            ctx.fillStyle = `rgb(${bright},${bright},${bright})`
            ctx.fillRect(x + bMortar, y + bMortar, sw2, bStoneH - bMortar * 2)
            x += 70 + bumpSeeded() * 90
        }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 2.2)
    tex.colorSpace = THREE.NoColorSpace
    return tex
}
