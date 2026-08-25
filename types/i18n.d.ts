import zh from "../messages/zh.json"

// 以 zh.json 作为权威 key 集，key 拼写错误在编译期暴露
declare module "next-intl" {
  interface AppConfig {
    Locale: "zh" | "en" | "ja" | "ko" | "fr" | "de"
    Messages: typeof zh
  }
}
