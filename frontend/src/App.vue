<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<style>
:root {
  --theme-color: #f8fafc;
  --theme-theme: #3b82f6;
  --theme-background: #0c0f17;
  --theme-other_background: #141924;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  min-height: 100%;
  overflow-x: hidden;
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #f8fafc;
  background-color: #0c0f17;
  word-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

#app {
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  background-color: #0c0f17;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 移动端全局样式 */
@media screen and (max-width: 768px) {
  #app {
    max-width: 100vw;
    overflow-x: hidden;
  }

  .van-button {
    height: 38px;
    font-size: 13px;
    border-radius: 8px;
  }

  .van-field {
    font-size: 14px;
    background: transparent;
  }

  .van-card {
    border-radius: 10px;
    margin: 8px 0;
  }
}
</style>
