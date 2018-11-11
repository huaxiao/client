require("weapp-adapter.js");
window.Parser = require("./xmldom/dom_parser");
let main = require("./code.js");

// 请在使用前先判断是否支持
if (typeof wx.getUpdateManager === 'function') {
  const updateManager = wx.getUpdateManager()

  updateManager.onCheckForUpdate(function (res) {
    // 请求完新版本信息的回调
    console.log("hasUpdate:"+res.hasUpdate)
  })

  updateManager.onUpdateReady(function () {
    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
    console.log("新的版本已经下载好，调用 applyUpdate 应用新版本并重启");
    updateManager.applyUpdate()
  })

  updateManager.onUpdateFailed(function () {
    // 新的版本下载失败
    console.log("新的版本下载失败");
  })
}