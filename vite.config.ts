import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
// target 固定 es2017：避免产物出现 `?.`/`??` 等 ES2020 语法，
// 真机 JSCore（尤其旧 iOS 的 JavaScriptCore）不支持可选链会导致白屏；
// 模拟器跑 Chromium 原生支持，测不出该问题，故构建期直接降级，不依赖开发者工具转译。
export default defineConfig({
  plugins: [uni()],
  build: {
    target: "es2017",
  },
});
