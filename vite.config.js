import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // 测试相关配置
    globals: true, // 允许使用全局测试函数（如 test, expect）
    environment: 'jsdom', // 模拟浏览器环境，适合测试 DOM 相关代码
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'mini-vue.js'
      },
      input: {
        main: './src/index.js',
      }
    },
    assetsDir: ''
  },
}); 