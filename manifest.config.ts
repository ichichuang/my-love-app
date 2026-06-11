const manifest = {
  name: "小程序架构模板",
  appid: "",
  description: "可复用的 UniApp 微信小程序开发架构。",
  versionName: "1.0.0",
  versionCode: "100",
  transformPx: false,
  "mp-weixin": {
    appid: "",
    darkmode: true,
    themeLocation: "theme.json",
    setting: {
      urlCheck: false,
      es6: true,
      postcss: true,
      minified: true
    },
    usingComponents: true
  },
  uniStatistics: {
    enable: false
  },
  vueVersion: "3"
}

export default manifest
