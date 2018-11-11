 /**
 * 微信小游戏 SDK
 */

var fetchingVideoAd = false;

var SDK_Wechat = (function(){
    var REPORT_URL = GameConst.PHPUrl+"event_stat/report";
    var info = {};    
    var rewardedVideoAd,nickName,headUrl;
    var bannerAd = null;

    var SDK_Wechat = Class();
    var p = SDK_Wechat.prototype;

    p.ctor = function(){
        this.info = info;
        info['pf'] = 'wechat'; 
        this.loginParams = null;       

        if(typeof(wx) == "undefined") return;


        Laya.MiniAdpter.window.wx.onShareAppMessage(onShareAppMessage);
        Laya.MiniAdpter.window.wx.showShareMenu({
                                                    withShareTicket: GameConst.WeChatGroup,
                                                    success: function(){
                                                        // console.log("showShareMenu success");
                                                    },
                                                    fail: function(){
                                                        // console.log("showShareMenu fail");
                                                    }
                                                });
    }

    function onShareAppMessage(res){
        var openid = '';
        if(GameData.getInstance()!=null && GameData.getInstance().user!=null)
            openid = GameData.getInstance().user.openid;

        return {
            title: '大大大大哥别扁我，我把豆都给你',
            imageUrl: GameConst.CDN+"wx_share10000.png",
            query: "inviteName="+nickName+"&openid="+openid+"&pos=0"+"&shareTime="+Date.now(),
            success: function (res){
                EventMgr.getInstance().event(EEvent.ShareSuccess,{'pos':0,'shareTickets':res.shareTickets,'from':1});
            },
        }
    }

    p.sdkLogin = function(callback,failCallback){
        if(typeof(wx) == "undefined") {
            var gamedata = GameData.getInstance();
            gamedata.user.loadCacheData();
            gamedata.goods.loadCacheData();
            return;
        }
        
        //调用wx.login前上报
        AladinSDK.report(AladinSDK.ReportTypes.LOGIN,'');

        this.report(ReportType.SDK_LoginStart,{openid:'',event:'SDK_LoginStart'});

        var _this = this;
        var successCb = function(res){
            var userInfo = res.userInfo;
            if(userInfo != null) {
                nickName = userInfo.nickName;
                headUrl = userInfo.avatarUrl;
            }
            if(nickName != null && _this.setNickNameCallback!=null)
              _this.setNickNameCallback.runWith(nickName);
            if(headUrl!=null && _this.setHeadCallback!=null)
              _this.setHeadCallback.runWith(headUrl);
            
            info["rawData"] = res.rawData;
            info["signature"] = res.signature;
            callback(info);

            var sysInfo = wx.getSystemInfoSync();
            
            GameMgr.getInstance().model = sysInfo.model.toLowerCase();

            SDKMgr.getInst().report(ReportType.SDK_LoginEnd,{openid:'',event:'SDK_LoginEnd'});
        };
        wx.login({
            success: function (res) {
                // console.log('wx.login success', res);
                info["js_code"] = res.code;
                wx.getUserInfo({
                    openIdList: ['selfOpenId'],
                    lang: 'zh_CN',
                    success: successCb,
                    fail: function (res) {
                    //   console.log('fail', res)
                      UIMgr.getInstance().showMask(true);
                      var info = wx.getSystemInfoSync();
                      var button = wx.createUserInfoButton({
                        type: 'text',
                        text: '获取用户信息',
                        style: {
                          left: info.screenWidth / 2 - 80,
                          top: info.screenHeight / 2 + 40,
                          width: 160,
                          height: 40,
                          lineHeight: 40,
                          backgroundColor: '#D13F66',
                          color: '#ffffff',
                          textAlign: 'center',
                          fontSize: 18,
                          borderRadius: 8
                        }
                      });
                      button.onTap(function (res) {
                        UIMgr.getInstance().showMask(false);
                        button.destroy();
                        AladinSDK.report(AladinSDK.ReportTypes.AUTH,'')
                        successCb(res);

                        SDKMgr.getInst().report(ReportType.Auth);
                      });
                    }
                });
            }
        });    
    }
    
    p.getSetting = function(callback,failCallback){
        var _this = this;
        wx.getSetting({
            success: function (res)
            {
                var authSetting = res.authSetting
                if (authSetting['scope.userInfo'] === true)
                {
                    _this.sdkLogin(callback,failCallback);
                } else if (authSetting['scope.userInfo'] === false)
                {
                    _this.openSetting();  // 用户已拒绝授权，再调用相关 API 或者 wx.authorize 会失败，需要引导用户到设置页面打开授权开关
                } else if(!authSetting['scope.record'])
                {
                    _this.sdkAuthorize('scope.record');
                }else if(!authSetting['scope.writePhotosAlbum']){
                    _this.sdkAuthorize('scope.writePhotosAlbum');
                }else if(!authSetting['scope.camera']){
                    _this.sdkAuthorize('scope.camera');
                }
            }
        });
    }
    
    p.openSetting = function(){
         wx.openSetting({
            success: function (res)
            {
                // console.log("openSetting:"+res);
                // if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"])
                // {
                // }
            }
        });
    }

    p.sdkAuthorize = function(scoreType){
        wx.authorize({
            scope: scoreType,
            success: function(res){
                AladinSDK.report(AladinSDK.ReportTypes.AUTH,'')
            },
            fail: function (res)
            {
                // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
                if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1)
                {
                    // 处理用户拒绝授权的情况
                }
            }
        });
    }

    // 昵称
    p.getNickName = function(callbackHdl){
        this.setNickNameCallback = callbackHdl;
        if(nickName!=null)
            callbackHdl.runWith(nickName);
    }

    //头像
    p.getHead = function(callbackHdl){
        this.setHeadCallback = callbackHdl;
        if(headUrl!=null)
            callbackHdl.runWith(headUrl);
    }

    p.share = function(pos,screenShot,from,url,content,time){
        if(typeof(wx) == "undefined") return;

        var sharePos = pos;
        var fromType = from;
        var openid = '';
        if(GameData.getInstance()!=null && GameData.getInstance().user!=null)
            openid = GameData.getInstance().user.openid;

        if(screenShot){
             wx.shareAppMessage({
                title: content,
                imageUrl: canvas.toTempFilePathSync({
                    destWidth: 500,
                    destHeight: 400
                }),
                query: "inviteName="+nickName+"&openid="+openid+"&pos="+sharePos+"&shareTime="+time,
                success: function (res){
                    EventMgr.getInstance().event(EEvent.ShareSuccess,{'pos':sharePos,'shareTickets':res.shareTickets,'from':fromType});
                },
                fail : function(res){
                    EventMgr.getInstance().event(EEvent.ShareFail,{'pos':sharePos,'from':fromType});
                }
            });
        }else{
            wx.shareAppMessage({
                title: content,
                imageUrl: url,
                query: "inviteName="+nickName+"&openid="+openid+"&pos="+sharePos+"&shareTime="+time,
                success: function (res){
                    EventMgr.getInstance().event(EEvent.ShareSuccess,{'pos':sharePos,'shareTickets':res.shareTickets,'from':fromType});
                },
                fail : function(res){
                    EventMgr.getInstance().event(EEvent.ShareFail,{'pos':sharePos,'from':fromType});
                }
            });
        }
    }

    var showPos = 0;
    p.showVideoAd = function(pos,adunitid){
        if(typeof(wx) == "undefined"){
            EventMgr.getInstance().event(EEvent.ShowAdCompleted,pos);
            EventMgr.getInstance().event(EEvent.CloseShowAd);
            return;
        } 

        if(GameConst.Sandbox){
            EventMgr.getInstance().event(EEvent.FetchVideoFail,pos);
            return;
        }

        var unitId = "adunit-727a9d7e923bb7d1";
        if(adunitid != null)
            unitId = adunitid;

        showPos = pos;
        var sdkVersion = wx.getSystemInfoSync().SDKVersion;
        if(sdkVersion>="2.0.4"){
            this.report(ReportType.Click_Ad);
            if(rewardedVideoAd == null)
            {
                rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: unitId });
                rewardedVideoAd.onClose(function(res) {
                    // 用户点击了【关闭广告】按钮
                    // 小于 2.1.0 的基础库版本，res 是一个 undefined
                    if (res && res.isEnded || res === undefined) {
                        // 正常播放结束，可以下发游戏奖励
                        EventMgr.getInstance().event(EEvent.ShowAdCompleted,showPos);
                        EventMgr.getInstance().event(EEvent.CloseShowAd);
                    }
                    else {
                        // 播放中途退出，不下发游戏奖励
                        EventMgr.getInstance().event(EEvent.CloseShowAd);
                    }
                });
                rewardedVideoAd.onError(function(res){
                    fetchingVideoAd = false;
                    console.log("fetch video error:"+res.errMsg);
                    EventMgr.getInstance().event(EEvent.FetchVideoFail,showPos);
                });

                rewardedVideoAd.onLoad(function(){
                    fetchingVideoAd = false;
                    console.log("fetch video success");
                });
            }

            rewardedVideoAd.adUnitId = unitId;

            fetchingVideoAd = true;
            rewardedVideoAd.load().then(function(){
                rewardedVideoAd.show();
            }).catch(function(err){
                console.log("video:"+err.errMsg);
            });
        }
    }

    var showBannerPos = 0;
    var hAlign =0;
    var vAlign = 0;
    var lastFetchBannerTime = 0;
    p.showBannerAd = function(pos,adunitid,halign,valign,w){
        if(typeof(wx) == "undefined") return;

        var unitId = "adunit-f87d859a6397922f";
        if(adunitid != null)
            unitId = adunitid;

        //如果不对废弃的 BannerAd 进行销毁，则会导致其上的事件监听器无法释放。当没有释放的 BannerAd 积累过多时，将会产生性能问题
        var needDelete = false;
        if(pos!=showBannerPos){
            needDelete = true;
        }else 
        {
            if((Date.now() - lastFetchBannerTime)>=120000){
                needDelete = true;
            }
        }

        if(needDelete){
            if(bannerAd != null){
                bannerAd.destroy();
                bannerAd = null;
            }
        }

        hAlign = halign;
        vAlign = valign;
        showBannerPos = pos;
        if(bannerAd == null)
        {
            lastFetchBannerTime = Date.now();

            bannerAd = wx.createBannerAd({ adUnitId: unitId,
                                            style: {
                                                left: 0,
                                                top: 0,
                                                width: 320
                                            } 
                                        });
            bannerAd.onError(function(res){
                console.log("fetch banner error:"+res.errMsg);
            });

            bannerAd.onResize(function(res){
                // console.log(res.width, res.height)
                // console.log(bannerAd.style.left, bannerAd.style.top)
                if(bannerAd == null||bannerAd.style==null) return;
                if(hAlign == 0){
                    bannerAd.style.left = 0;
                }else if(halign == 1){
                    bannerAd.style.left = (windowWidth - res.width) * 0.5; 
                }else if(halign == 2){
                    bannerAd.style.left = windowWidth - res.width; 
                }

                if(vAlign == 0){
                    bannerAd.style.top = 0;
                }else if(vAlign == 1){
                    bannerAd.style.top = (windowHeight - res.height) * 0.5; 
                }else if(vAlign == 2){
                    bannerAd.style.top = windowHeight - res.height; 
                }
            });
        }
        bannerAd.adUnitId = unitId;
        bannerAd.show().catch(function(err){console.log("show banner error:"+err.errMsg);});
        if(bannerAd.style)
            bannerAd.style.width = w;
    }

    p.hideBannerAd = function(){
        if(bannerAd!=null){
            // bannerAd.hide();
            bannerAd.destroy();
            bannerAd = null;
        }
    }

    p.report = function(type,params){
        if(typeof(wx) == "undefined") return;

        if(params == null){
            params = {'openid':GameData.getInstance().user.openid,'nickname':nickName};
        }else{
            params.openid = GameData.getInstance().user.openid;
            params.nickname = nickName;
        }

        // this.wxReport(type,params);
        this.handleReport(type,params);
    }

    p.wxReport = function(type,params){
        var reportName = this.getReportName(type);

        if(reportName == null) return;
        wx.reportAnalytics(reportName,params);
    }

    p.handleReport = function(type,params){
        var cfg = DataMgr.getInstance().getReportCfg(type);
        if(cfg == null) {
            if(params == null || params.event == null){
                return;
            }
        }else{
            params.event = cfg.event;
        }

        var paramStr = Utils.parseParams(params);
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                EventMgr.getInstance().event(EEvent.Error,"\nerror:"+err);
            }
            else {
                if(data.result != 0) {
                    EventMgr.getInstance().event(EEvent.Error,data);
                }
            }
        });

        // console.log("handleReport:"+paramStr);
        http.sendPostWithUrl(REPORT_URL,paramStr);
    }

    p.uploadScore = function(start_game_time,scoreValue,star){
        this.uploadScoreWechat(start_game_time,scoreValue,star);

        if(scoreValue != 0) {
            var name = GameData.getInstance().user.uname;
            var params = {'openid':GameData.getInstance().user.openid,'score':scoreValue,'nick':name};
            var paramStr = Utils.parseParams(params);
            var http = new HttpLaya(function(err, data) {
                if(err != null) {
                    console.log("updatescore error:"+err);
                }
                else {
                    if(data.result != 0) {
                        console.log("updatescore result:"+data.result);
                    }
                }
            });
            http.sendPostWithUrl(GameConst.PHPUrl+"wx_rank/report",paramStr);
        }else{
            this.uploadGradeStar(start_game_time,star);
        }
    }

    p.uploadGradeStar = function(start_game_time,star) {
        var name = GameData.getInstance().user.uname;
        var params = {'openid':GameData.getInstance().user.openid,'nick':name,'star':star};
        var paramStr = Utils.parseParams(params);
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                console.log("uploadGradeStar error:"+err);
            }
            else {
                if(data.result != 0) {
                    console.log("uploadGradeStar result:"+data.result);
                }
            }
        });
        http.sendPostWithUrl(GameConst.PHPUrl+"duanwei_rank/report",paramStr);
    }

    //微信排行榜
    p.uploadScoreWechat = function(start_game_time,scoreValue,star){
        if(!GameConst.SupportOpenDomain) return;

        var openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            text: "UploadScore",
            openid: GameData.getInstance().user.openid,
            score: scoreValue,
            star: star
        });
    }

    p.uploadGradeData = function(){
        if(typeof(wx) == "undefined") return;

        var openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            text: "SetGradeData",
            maxUserGrade: DataMgr.getInstance().getMaxUserGrade(),
            cfgData:DataMgr.getInstance().userGradeCfgData
        });
    }

    p.queryRank = function(type,subType,callbackHdl){
        if(subType == "friend") {
            SDKMgr.getInst().showFriendRank("max",type); 
            return;
        }

        var params = {'openid':GameData.getInstance().user.openid};
        var paramStr = Utils.parseParams(params);
        if(type == RankType.Grade){
            var url = GameConst.PHPUrl+"duanwei_rank/query?"+paramStr;
        }else{
            var url = GameConst.PHPUrl+"wx_rank/query?"+paramStr;
        }

        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                EventMgr.getInstance().event(EEvent.Error,"\nerror:"+err);
            }
            else {
               if(callbackHdl!=null)
                  callbackHdl.runWith(data);
            }
        });

        http.sendGetWithUrl(url);
    }

    p.showFriendRank = function(type,category) {
        if(!GameConst.SupportOpenDomain) return;

        var openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            text: "RankScore",
            type: type,
            category: category,
            openid: GameData.getInstance().user.openid
        });
    }

    p.hideFriendRank = function(type){
        if(!GameConst.SupportOpenDomain) return;
        
        var openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            text: "HideRank",
            type: type,
            openid: GameData.getInstance().user.openid
        });
    }

    p.getReportName = function(type){
         var cfg = DataMgr.getInstance().getReportCfg(type);
         if(cfg == null) return null;

         return cfg.event;
    } 

    return SDK_Wechat;
})();


//重新指定json编码为utf8
laya.wx.mini.MiniAdpter.getUrlEncode=function(url,type){
    if (url.indexOf(".fnt") != -1 || url.indexOf(".json") != -1)
        return "utf8";
    else if(type=="arraybuffer")
        return "";
    return "ascii";
}

// //本地包白名单机制,引擎会自动将该目录视为本地目录
// laya.wx.mini.MiniAdpter.nativefiles=[
//     "wxlocal",
//     "res/atlas/houzi.atlas",
//     "res/atlas/houzi.png",
//     "common/tishi.png",
//     "common/bg.png",
//     "ui.json",
//     "newLb/bg031.png"
// ];