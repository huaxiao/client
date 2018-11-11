var InComeType = {
    Share : 1,      
    Video : 2,
}

var RewardType = {
    None : 0 ,
    Gold : 1,
    ReviveStone : 2,
    Buff : 3,
    Revive : 4,
}

var RewardAddType = {
    Add : 1,
    Multi : 2,
}

var ShareVideoPos = {
    DailyLogin : 1,             
    FourHourGold : 2,           
    ShareToGainStone : 3,       
    GradeMultiTimesScore : 4,   
    GradeInvincible : 5,        
    GradeNormalRevive : 6,      
    GradeKillAll : 7,           
    GradeSettleShare1 : 8,
    GradeDoubleGold : 9,
    GradeSettleShare2 : 10,
    EndlessMultiTimesScore : 11,
    EndlessInvincible : 12,
    EndlessNormalRevive : 13,
    EndlessKillAll : 14,
    EndlessShare : 15,
    EndlessDoubleGold : 16,
    Skin : 17,
    StartMultiTimesScore : 18,
    StartKillAll : 19,
    ShareOnRank : 20,
    Max : 21,
}

var CheckShareProtectedInterval = 10000;

var CheckIPMgr = (function () {
    function CheckIPMgr() {
        this.m_lastCallTime = 0;
        this.liebianUrl = GameConst.PHPUrl+"liebian/";

        this.m_videoMapping = {};
        this.m_shareMapping = {};
        this.m_clickShareCnts = {};

        this.m_canFetchVideo = true;
        this.m_useVideoMaxTime = null;

        this.m_isShowingBanner = false;
        this.m_isShowingBannerPos = 0;
        this.m_dailyShareMapping = {};      //是否分享过
        this.m_inited = false;
        this.m_callShare = false;
        this.m_callShareReward = false;

        this.initShareProtected();
        this.registerEvent();
        this.readVideoCache();
    }

     CheckIPMgr.getInstance = function(){
        if(CheckIPMgr._instance == null){
            CheckIPMgr._instance = new CheckIPMgr();
        }
        return CheckIPMgr._instance;
    }

    var p = CheckIPMgr.prototype;

    p.registerEvent = function(){
        EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().on(EEvent.FetchVideoFail,this,this.onFetchVideoFail);
        EventMgr.getInstance().on(EEvent.ServerLoginOk,this,this.onServerLoginOk);
        EventMgr.getInstance().on(EEvent.ResourceLoaded,this,this.onResourceLoaded);
        EventMgr.getInstance().on(EEvent.GetFocus,this,this.onGameFocus);
        Laya.timer.loop(3600000,this,this.onCheckVideoCntTimer);
    }

    p.unregisterEvent = function(){
        EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().off(EEvent.FetchVideoFail,this,this.onFetchVideoFail);
        EventMgr.getInstance().off(EEvent.ServerLoginOk,this,this.onServerLoginOk);
        EventMgr.getInstance().off(EEvent.ResourceLoaded,this,this.onResourceLoaded);
        EventMgr.getInstance().off(EEvent.GetFocus,this,this.onGameFocus);
    }

    p.onResourceLoaded = function(){
        this.initShareProtected();
    }

    p.initShareProtected = function(){
        if(!DataMgr.getInstance().isLoaded()) return;

        if(this.m_inited) return;

        this.m_shareProtectedTotalTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.NewPlayerShareProtectedTime);
        this.m_leftShareProtectedTime = this.m_shareProtectedTotalTime - accountTime;
        if(this.m_leftShareProtectedTime <= 0){
            this.m_leftShareProtectedTime = 0;
        }else{
            Laya.timer.loop(CheckShareProtectedInterval,this,this.onCheckShareProtectedTimer);
        }

        this.m_inited = true;
    }

    p.canShowVideo = function(){
        return this.m_canFetchVideo;
    }

    p.onFetchVideoFail = function(pos){
        this.m_canFetchVideo = false;
        this.m_useVideoMaxTime = (new Date()).toString();
        this.saveVideoCache();

        var canShare = false;
        var cfg = DataMgr.getInstance().getVideoShareCfg(pos);
        if(cfg == null){
            console.log("配置文件不存在 pos:"+pos);
            return;
        }

        if(cfg.shareStep <= this.getShareIncomeStep(cfg))
            canShare = true;

        UIMgr.getInstance().openUI(EUI.VideoFailView,{'pos':pos,'showShare':canShare,'gold':cfg.gold});
    }

    p.getShareIncomeStep = function(cfg){
        var shareIncome = this.getShareIncome(cfg.pos);
        if(shareIncome < cfg.shareRatioA){
           return 1;
        }else if(shareIncome >=cfg.shareRatioA && shareIncome < cfg.shareRatioB){
           return 2;
        }else if(shareIncome >=cfg.shareRatioB && shareIncome < cfg.shareRatioC){
            return 3;
        }else {
           return 4;
        }
    }

    p.onCheckShareProtectedTimer = function(){
        this.m_leftShareProtectedTime -= CheckShareProtectedInterval;
        if(this.m_leftShareProtectedTime <= 0 ){
            this.m_shareProtectedTotalTime = 0;
            Laya.timer.clear(this,this.onCheckShareProtectedTimer);
            this.queryShare();   
        }
    }

    p.onCheckVideoCntTimer = function(){
        if(this.m_canFetchVideo) return;

        var forbidDt = new Date(this.m_useVideoMaxTime);
        var y1 = forbidDt.getFullYear();
        var m1 = forbidDt.getMonth();
        var d1 = forbidDt.getDate();

        var dt = new Date();
        var y = dt.getFullYear();
        var m = dt.getMonth();
        var d = dt.getDate();

        if((y > y1) ||((y == y1) &&((m > m1) || (m == m1 && d > d1))))
        {
            this.m_canFetchVideo = true;
            this.m_useVideoMaxTime = null;
            this.saveVideoCache();
        }
    }

    p.saveVideoCache = function(){
        Laya.LocalStorage.setItem("canFetchVideo", this.m_canFetchVideo?1:0);
        Laya.LocalStorage.setItem("useVideoMaxTime", this.m_useVideoMaxTime);
    }

    p.saveShareCache = function(pos,time){
        this.m_dailyShareMapping[pos] = {'shared':true,'shareTime':time};
        Laya.LocalStorage.setJSON("dailySharedMapping",this.m_dailyShareMapping);
    }

    p.readVideoCache = function(){
        var dt = new Date();
        var y = dt.getFullYear();
        var m = dt.getMonth();
        var d = dt.getDate();

        var temp = Laya.LocalStorage.getJSON("dailySharedMapping");
        for(var p in temp){
            var shareInfo = temp[p];
            var shared = shareInfo.shared;
            var sharedTime  = shareInfo.shareTime;
            var sharedDT = new Date(sharedTime);
            var y1 = sharedDT.getFullYear();
            var m1 = sharedDT.getMonth();
            var d1 = sharedDT.getDate();

            if((y > y1) ||((y == y1) &&((m > m1) || (m == m1 && d > d1))))
            {
                shared = false;
                sharedTime = null;
            }
            this.m_dailyShareMapping[p] =  {'shared':shared,'shareTime':sharedTime};
        }
        console.log(JSON.stringify(this.m_dailyShareMapping));

        temp = Laya.LocalStorage.getItem("canFetchVideo") || 0;
        this.m_canFetchVideo = ((parseInt(temp) || 0)== 1)?true:false;

        this.m_useVideoMaxTime = Laya.LocalStorage.getItem("useVideoMaxTime");

        if(this.m_useVideoMaxTime != null && this.m_useVideoMaxTime.toString().trim() != ''){
            var forbidDt = new Date(this.m_useVideoMaxTime);
            var y1 = forbidDt.getFullYear();
            var m1 = forbidDt.getMonth();
            var d1 = forbidDt.getDate();

            console.log(" forbidDt:"+forbidDt+" dt:"+dt);

            if((y > y1) ||((y == y1) &&((m > m1) || (m == m1 && d > d1))))
            {
                this.m_canFetchVideo = true;
                this.m_useVideoMaxTime = null;
                this.saveVideoCache();
            }
        }else{
            this.m_canFetchVideo = true;
        }
    }

    p.isShareProtected = function(){
        return this.m_leftShareProtectedTime > 0;
    }

    p.getType = function(type,pos,maxcnt){
        if(this.wxCheck()){
            return InComeType.Video;
        }
        else{
            var city = GameData.getInstance().user.city;
            if(this.onLimitTime()){
                if(GameConst.WeChatIPCheck && GameData.getInstance().user != null && DataMgr.getInstance().isLimitedCity(city) ){
                    return type;
                }else{
                    if(GameData.getInstance().user!=null && GameData.getInstance().user.olderPlayer){
                        return InComeType.Share;
                    }else{
                        if(type == InComeType.Video){
                            if(this.getVideoCnt(pos)>=maxcnt){
                                return InComeType.Share;
                            }else
                            {
                                return InComeType.Video;
                            }
                        }
                        return InComeType.Share;
                    }
                }
            }else{
                return InComeType.Share;
            }  
        }
    }


    p.wxCheck = function(){
        return GameConst.State == InComeState.Ckeck;
    }

    p.fissionState = function(){
        return GameConst.State == InComeState.Fission;
    }

    p.getVideoCnt = function(pos){
        var cnt = this.m_videoMapping[pos];
        if(cnt == null) return 0;

        return cnt;
    }
    
    p.getShareClickCnt = function(pos){
        var cnt = this.m_clickShareCnts[pos];
        if(cnt == null) return 0;

        return cnt;
    }

    p.addShareClickCnt = function(pos){
        var cnt = this.m_clickShareCnts[pos];
        if(cnt == null)
            cnt = 1;
        else
            cnt++;

        this.m_clickShareCnts[pos] = cnt;
    }

    p.showBanner = function(pos){
        var cfg = DataMgr.getInstance().getBannerCfg(pos);
        if(cfg == null) return;

        this.m_isShowingBanner = true;
        if(this.m_isShowingBannerPos == 0)
            this.m_isShowingBannerPos = pos;
        SDKMgr.getInst().showBannerAd(pos,cfg.adunit,cfg.hAlign,cfg.vAlign,cfg.w);
    }

    p.hideBanner = function(pos){
        this.m_isShowingBanner = false;
        if(this.m_isShowingBannerPos == pos)
            this.m_isShowingBannerPos = 0;
        SDKMgr.getInst().hideBannerAd();
    }
    
    p.isShowingBanner = function(){
        return this.m_isShowingBanner;
    }

    p.restoreBanner = function(){
        this.showBanner(this.m_isShowingBannerPos);
    }

    p.showVideoOrShare = function(pos){
        if(this.m_lastCallTime > 0){
            var temp = Date.now() - this.m_lastCallTime;
            if(temp < 300){
                return;
            }
        }

        if(fetchingVideoAd && (Date.now() - this.m_lastCallTime)<10000) {
            UIMgr.getInstance().showTips("正在拉取视频",2000);
            return;
        }

        this.m_callShareReward = false;
        this.m_callShare = false;
        this.m_lastCallTime = Date.now();

        var cfg = DataMgr.getInstance().getVideoShareCfg(pos);
        if(cfg == null){
            console.log("视频分享点没有配置");
            return;
        }

        if(this.wxCheck()){
            this.handleVideo(cfg);
            return;
        }

        var shareIncome = this.getShareIncome(pos);
        var clickCnt = this.getShareClickCnt(pos);

        if(cfg.haseffect == 0){
            if(cfg.type == InComeType.Video){
                this.handleVideo(cfg);
            }else{
                this.handleShare(cfg,true);
            }
        }else{
            if(this.isShareProtected()){
                if(GameConst.ShareProtectedStep == 2){
                    if(clickCnt%3 == 2){
                        this.handleShare(cfg,true);
                    }else{
                        this.handleVideo(cfg);
                    }
                }else if(GameConst.ShareProtectedStep == 3){
                    if(clickCnt % 3 == 2){
                        this.handleVideo(cfg);
                    }else{
                        this.handleShare(cfg,true);
                    }
                }
            }else{
                if(shareIncome < cfg.shareRatioA){
                    if(!this.hasDailyShared(pos)){
                        this.handleShare(cfg,false);
                    }else{
                        this.handleVideo(cfg);
                    }
                }else if(shareIncome >=cfg.shareRatioA && shareIncome < cfg.shareRatioB){
                    if(clickCnt%3 == 2){
                        this.handleShare(cfg,true);
                    }else{
                        this.handleVideo(cfg);
                    }
                }else if(shareIncome >=cfg.shareRatioB && shareIncome < cfg.shareRatioC){
                    if(clickCnt % 3 == 2){
                        this.handleVideo(cfg);
                    }else{
                        this.handleShare(cfg,true);
                    }
                }else {
                    this.handleShare(cfg,true);
                }
            }
            this.addShareClickCnt(pos);
        }
    }

    p.onlyShare = function(pos){
        var cfg = DataMgr.getInstance().getVideoShareCfg(pos);
        if(cfg == null){
            console.log("视频分享点没有配置");
            return false;
        }

        this.handleShare(cfg,false);
        this.addShareClickCnt(pos);
        return true;
    }

    p.handleVideo = function(cfg){
        if(this.canShowVideo()){
            SDKMgr.getInst().showVideoAd(cfg.pos,cfg.adunit);
        }else{
            this.onFetchVideoFail(cfg.pos);
        }
    }

    p.handleShare = function(cfg,reward){
        if(!this.hasDailyShared(cfg.pos)){
            this.saveShareCache(cfg.pos,(new Date()).toString());
        }

        var time = Date.now();
        this.uploadShare(cfg.pos,time);
        SDKMgr.getInst().share(cfg.pos,cfg.shot == 1,cfg.type,cfg.imgUrl,cfg.shareContent,time);

        this.m_callShareReward = reward;
        this.m_callShare = true;
        this.m_callShareCfg = cfg;
    }

    p.hasDailyShared = function(pos){
        var val = this.m_dailyShareMapping[pos];
        if(val!=null){
            return val.shared;
        }
        return false;
    }

    p.onShowAdCompleted = function(pos){
        SDKMgr.getInst().report(ReportType.Show_Ad_Reward);

        var cnt = this.m_videoMapping[pos];
        if(cnt == null)
            cnt = 1;
        else
            cnt++;

        this.m_videoMapping[pos] = cnt;

        var cfg = DataMgr.getInstance().getVideoShareCfg(pos);
        if(cfg != null && cfg.type == InComeType.Share){
            if(cfg.rewardType == RewardType.Gold){
                ServerAgency.getInstance().sendWatchAdToGetGold(cfg.serverPos);
            }
            else if(cfg.rewardType == RewardType.ReviveStone){
                ServerAgency.getInstance().rpcShareToGetReviveStone(false);
            }
        }
    }

    p.handleShareReward = function(rewardType,cfg){
        if(rewardType == RewardType.Gold){
            ServerAgency.getInstance().sendWatchAdToGetGold(cfg.serverPos);
        }
        else if(rewardType == RewardType.ReviveStone){
            ServerAgency.getInstance().rpcShareToGetReviveStone(false);
        }else if(rewardType == RewardType.Buff){
            //获得buff
        }else if(rewardType == RewardType.Revive){
            //满血复活
        }
    }

    p.onShareFail = function(data){
        var from = data.from;
        var pos = data.pos;
        if(from == InComeType.Video){
            EventMgr.getInstance().event(EEvent.CloseShowAd);
        }
    }

    p.onLimitTime = function(){
        var dt = new Date();
        var day = dt.getDay();
        var hour = dt.getHours();

        if(day>=GameConst.LimitMinDay && day<= GameConst.LimitMaxDay && hour>= GameConst.LimitMinHour && hour<=GameConst.LimitMaxHour){
            return true;
        }

        return false;
    }

    p.onGameFocus = function(){
        if(this.m_callShare && this.m_callShareCfg!=null){
            if(this.m_callShareCfg.type == InComeType.Video){
                Utils.finishVideo(this.m_callShareCfg.pos);
            }else{
                if(this.m_callShareReward){
                    this.handleShareReward(this.m_callShareCfg.rewardType,this.m_callShareCfg);   
                }
            }
            
            if(!this.m_callShareReward){
                UIMgr.getInstance().showTips("分享失败，请分享到好友或群!!",2000);
            }
        }
        this.m_callShare = false;
    }

    p.onServerLoginOk = function(){
        this.queryShare();
    }

    p.getShareIncome = function(pos){
        var val = this.m_shareMapping[pos];
        if(val == null || val == undefined)
            val = 0;

        return val;
    }

    p.setShareLiebanData = function(data){
        // console.log("ShareData:"+JSON.stringify(data));
        if(data!=null)
        {
            for(var key in data){
                var obj = data[key];
                if(obj.share_times == 0){
                    this.m_shareMapping[obj.pos] = 0;
                }else{
                    this.m_shareMapping[obj.pos] = 10000*(obj.clicks / obj.share_times);
                }
            }
        }
    }
    

    p.uploadShare = function(pos,time){
        var params = {'openid':GameData.getInstance().user.openid,'pos':pos,'share_time':time};
        var paramStr = Utils.parseParams(params);
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                console.log("uploadShare error:"+err);
            }
            else {
                if(data.result != 0) {
                    console.log("uploadShare result:"+data.result);
                }
            }
        });
        // console.log("uploadShare:"+paramStr);
        http.sendPostWithUrl(this.liebianUrl+"share",paramStr);
    }

    p.queryShare = function(){
        var posStr = "";
        for(var p = ShareVideoPos.DailyLogin; p < ShareVideoPos.Max;p++){
            if(p == ShareVideoPos.DailyLogin){
                posStr = p;
            }else{
                posStr = posStr +"|"+ p;
            }
        }

        var params = {'openid':GameData.getInstance().user.openid,'pos':posStr};
        var paramStr = Utils.parseParams(params);
        var http = new HttpLaya(function(err, res) {
            if(err != null) {
                console.log("uploadShare error:"+err);
            }
            else {
                if(res.result == 0) {
                    CheckIPMgr.getInstance().setShareLiebanData(res.data);
                }
            }
        });
        http.sendGetWithUrl(this.liebianUrl+"query?"+paramStr);
    }

    CheckIPMgr.uploadLink = function(pos,inviter,sharetime){
        var params = {'openid':GameData.getInstance().user.openid,'pos':pos,'from_openid':inviter,'share_time':sharetime};
        var paramStr = Utils.parseParams(params);
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                console.log("uploadShare error:"+err);
            }
            else {
                if(data.result != 0) {
                    console.log("uploadShare result:"+data.result);
                }
            }
        });

        // console.log("uploadLink:"+paramStr);
        http.sendPostWithUrl(GameConst.PHPUrl+"liebian/click",paramStr);
    }
    
    return CheckIPMgr;
}());

CheckIPMgr._instance = null;