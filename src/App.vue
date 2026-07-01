<script setup>
import MazeGame from './components/MazeGame.vue'
</script>

<template>
  <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  <MazeGame />
</template>

<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
}

#app {
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #16161f;
  position: relative;
  overflow: hidden;
}

/* ===== 多层晕染渐变背景（极光式缓慢漂移） ===== */
#app::before {
  content: '';
  position: fixed;
  inset: -15%;
  z-index: 0;
  background:
    radial-gradient(ellipse at 22% 32%, rgba(135, 105, 185, 0.24) 0%, transparent 55%),
    radial-gradient(ellipse at 78% 22%, rgba(185, 145, 95, 0.19) 0%, transparent 50%),
    radial-gradient(ellipse at 28% 72%, rgba(90, 125, 175, 0.20) 0%, transparent 52%),
    radial-gradient(ellipse at 72% 68%, rgba(165, 115, 145, 0.17) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(100, 110, 150, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse at 58% 38%, rgba(200, 170, 120, 0.13) 0%, transparent 58%),
    radial-gradient(ellipse at 38% 58%, rgba(110, 140, 195, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse at 65% 55%, rgba(140, 100, 160, 0.10) 0%, transparent 60%);
  animation: auroraDrift 20s ease-in-out infinite alternate;
}

@keyframes auroraDrift {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.70;
  }
  25% {
    transform: translate(-1.8%, 1.2%) scale(1.05);
    opacity: 0.88;
  }
  50% {
    transform: translate(1.2%, -1.6%) scale(1.08);
    opacity: 0.78;
  }
  75% {
    transform: translate(-0.6%, -0.8%) scale(1.03);
    opacity: 0.92;
  }
  100% {
    transform: translate(0.8%, 0.5%) scale(1.10);
    opacity: 0.85;
  }
}

/* 微弱的纹理叠加（模拟石质噪点） */
#app::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
}
</style>