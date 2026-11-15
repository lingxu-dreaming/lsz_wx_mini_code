import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { registerSilentLogin } from "./utils/request";
import { useAuthStore } from "./store/auth";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // 注入 401 无感续期提供者：清 token → 静默重登 → 重放原请求
  registerSilentLogin(async () => {
    const outcome = await useAuthStore(pinia).silentLogin();
    return outcome.type === "home";
  });

  return {
    app,
  };
}
