const manifest = {
  name: "珊瑚行动",
  appid: "",
  description: "A private romantic WeChat Mini Program for two people.",
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
