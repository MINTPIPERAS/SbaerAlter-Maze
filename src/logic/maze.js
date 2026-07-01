// ══════════════════════════════════════════════
//  src/logic/maze.js
//  迷宫生成算法（纯函数，无副作用）
// ══════════════════════════════════════════════

import { START_CELL } from './constants.js'

/**
 * Fisher-Yates 洗牌（返回新数组）
 */
export function shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

/**
 * 递归回溯算法生成迷宫
 * @param {number} rows - 行数（奇数）
 * @param {number} cols - 列数（奇数）
 * @returns {{ maze: number[][], endCell: {x:number, z:number} }}
 */
export function generateMaze(rows, cols) {
    // 初始全墙 (1)
    const grid = Array.from({ length: rows }, () => Array(cols).fill(1))
    const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]]

    // DFS 挖掘通道
    function carve(x, z) {
        grid[z][x] = 0
        for (const [dx, dz] of shuffleArray(dirs)) {
            const nx = x + dx, nz = z + dz
            if (nx <= 0 || nx >= cols - 1 || nz <= 0 || nz >= rows - 1) continue
            if (grid[nz][nx] === 0) continue
            // 打通当前格与邻居之间的墙
            grid[z + dz / 2][x + dx / 2] = 0
            grid[nz][nx] = 0
            carve(nx, nz)
        }
    }

    carve(START_CELL.x, START_CELL.z)

    // BFS 找离起点最远的可达格作为终点
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
    const queue = [{ x: START_CELL.x, z: START_CELL.z, d: 0 }]
    visited[START_CELL.z][START_CELL.x] = true
    let farthest = { x: START_CELL.x, z: START_CELL.z, d: 0 }

    while (queue.length > 0) {
        const cur = queue.shift()
        if (cur.d > farthest.d) farthest = cur
        for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cur.x + sx, nz = cur.z + sz
            if (nx < 0 || nx >= cols || nz < 0 || nz >= rows) continue
            if (visited[nz][nx] || grid[nz][nx] === 1) continue
            visited[nz][nx] = true
            queue.push({ x: nx, z: nz, d: cur.d + 1 })
        }
    }

    return { maze: grid, endCell: { x: farthest.x, z: farthest.z } }
}
