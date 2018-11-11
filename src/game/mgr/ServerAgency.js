
var ServerAgency = (function(){
    function ServerAgency() {
        this.reset();
    }

    /**
     * 单例
     */
    ServerAgency.getInstance = function(){
        if(ServerAgency._instance == null){
            ServerAgency._instance = new ServerAgency();
        }
        return ServerAgency._instance;
    }

    var p = ServerAgency.prototype;

    p.clear = function() {
        this.unregister();
        this.reset();
    }

    p.tryReconnect = function(){
        if(NetMgr.getInstance().connected() || NetMgr.getInstance().kicked)
        {
            TimerUtil.clear(this,this.tryReconnect);
        }else{
            if(NetMgr.getInstance().m_host!=""){
                this.onGameServerReconnect();
            }
            else{
                TimerUtil.clear(this,this.tryReconnect);
            }
        }
    }

    p.register = function() {
        NetMgr.getInstance().register(RPC.S2C_PlayerEnterFight,this.onPlayerEnterFight,this);   
        NetMgr.getInstance().register(RPC.S2C_UpdateGoods,this.onUpdateGoods,this);
        NetMgr.getInstance().register(RPC.S2C_ResetDailyData,this.onResetDailyData,this);
        NetMgr.getInstance().register(RPC.S2C_ResetMonthlyData,this.onResetMonthlyData,this);
        EventMgr.getInstance().on(EEvent.onNetworkChange,this,this.onNetworkChange);
        this.m_bRigistered = true;
    }

    p.unregister = function() {
        NetMgr.getInstance().unregister(RPC.S2C_PlayerEnterFight,this.onPlayerEnterFight,this);
        NetMgr.getInstance().unregister(RPC.S2C_UpdateGoods,this.onUpdateGoods,this);
        NetMgr.getInstance().unregister(RPC.S2C_ResetDailyData,this.onResetDailyData,this);
        NetMgr.getInstance().unregister(RPC.S2C_ResetMonthlyData,this.onResetMonthlyData,this);
        EventMgr.getInstance().off(EEvent.onNetworkChange,this,this.onNetworkChange);
        this.m_bRigistered = false;
    }

    p.onNetworkChange = function(){
        NetMgr.getInstance().reconnectionPomelo();
    }

    p.registerOnce = function() {
        if(this.m_bRigistered != true)
            this.register();
    }

    p.reset = function() {
        this.m_lastSendRotate = 0;   
        // this.m_firstTimeLogin = false;     
    }

    /********************** Send *********************************/
    p.sdkLogin = function(params) {
        var arr = new Array();
        for(var key in params)
        {
            arr.push([key,params[key]]);
        }
        this.sdkParams = arr;
        this.onSDKLogin();
    }

    p.onSDKLogin = function() {
        var _this = this;
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                console.log("登录失败:",err);
                EventMgr.getInstance().event(EEvent.Error,"登录失败:"+err);
            }
            else {
                if(data.code == ECode.OK) {
                    var token = data.token;
                    var uid = data.uid;
                    if(uid) {
                        var user = GameData.getInstance().user;
                        user.setUid(uid);
                        user.loadCacheData();
                        user.token = token;
                        user.session_key = data.session_key;
                        user.openid = data.openid;
                        user.city = data.city;
                        
                        AladinSDK.report(AladinSDK.ReportTypes.OPEN_ID,data.openid);

                        var goods = GameData.getInstance().goods;
                        goods.setUid(uid);
                        var isCache = goods.loadCacheData();

                        SDKMgr.getInst().report(ReportType.Login);

                        if(!isCache) {
                            var netMgr = NetMgr.getInstance();
                            netMgr.m_host = data.host;
                            netMgr.m_port = data.port;
                            ServerAgency.getInstance().onGameServerConnect();
                        }
                        else {
                            GameMgr.getInstance().checkDailyPrize();
                        }
                    }
                }
                else {
                    console.log("登录失败:",data.code);
                    EventMgr.getInstance().event(EEvent.Error,"登录失败:"+data.code);
                    TimerUtil.once(5000,_this,_this.onSDKLogin);
                }
            }
        },3);
        http.sendPost(NetMgr.getInstance().loginUrl,_this.sdkParams,"sdkLogin");
    }

    p.onGameServerConnect = function() {
		var netMgr = NetMgr.getInstance();
		var data = GameData.getInstance();
		var uid = data.user.uid;
		var token = data.user.token;
        var _this = this;
        if(netMgr.m_port != null && netMgr.m_host != null) {
            //如果3001端口返回host和ip就直接连接connector,不走gate,因为gate是瓶颈
            _this.entryServer(token,false);
        }
        else {
            netMgr.queryEntry(uid, function(host,port) {
                console.log("queryEntry",host, port);
                netMgr.m_host = host;
                netMgr.m_port = port;

                _this.entryServer(token,false);
            });
        }
	}

    p.entryServer = function(token,reconn){
        var netMgr = NetMgr.getInstance();
        var bReconnect = reconn;
        var _this = this;
        netMgr.entry(netMgr.m_host, netMgr.m_port, token, function (data) {
			if (data.code == ECode.OK) {
				_this.setUserData(data,bReconnect);
                NetMgr.getInstance().send(RPC.C2S_Enter_Lobby,null);
                if(bReconnect){
                    NetMgr.getInstance().resendConfirmMsg();
                }
			}
			else {
				console.error('entryServer error code:', data.code);
				// UIMgr.getInstance().showDialog("进入战斗失败 "+(data ? data.code : "null"));
                NetMgr.getInstance().disconnectPomelo();
                _this.reconnectServer();
			}
		});
    }

    p.reconnectServer = function(){
        // this.m_firstTimeLogin = false;
        TimerUtil.clear(this,this.tryReconnect);
        TimerUtil.loop(12000,this,this.tryReconnect);
        // this.tryReconnect();不要立即重连，减轻服务器压力
    }

    p.onGameServerReconnect = function(){		
		var data = GameData.getInstance();
		var token = data.user.token;        
        EventMgr.getInstance().event(EEvent.Error," onGameServerReconnect");

		this.entryServer(token,true);
	}

    p.setUserData = function(retData,reconn){
        var user = GameData.getInstance().user;
        user.setUname(retData.uname,true);
        user.setLv(retData.lv);
        user.setStar(retData.star);
        user.setGrow(retData.grow);
        user.highScore = retData.highScore;
        user.createTime = retData.createTime;
        user.setServerData(true);

        var goods = GameData.getInstance().goods;
        for(var k in retData) {
            if(goods[k] != null) {
                goods[k] = retData[k] || 0;
            }
        }

        if(!reconn){
             GameMgr.getInstance().checkDailyPrize();
        }
    }

    p.sendRotate = function(rotate){
        if(rotate == this.m_lastSendRotate)
            return;
        NetMgr.getInstance().send(RPC.C2S_Player_Rotate,{rotate:rotate});
        this.m_lastSendRotate = rotate;
    }

    p.rpcAttack = function() {
        NetMgr.getInstance().send(RPC.C2S_Player_Attack,null);
    }

    p.rpcSpeedUp = function() {
        NetMgr.getInstance().send(RPC.C2S_Player_SpeedUp,null);
    }

    p.rpcSwitchMove = function() {
        NetMgr.getInstance().rpc(RPC.C2S_Player_SwitchMove,null,null);
    }

    p.rpcShareToGetReviveStone = function(bShowTips) {
        NetMgr.getInstance().rpc(RPC.C2S_ShareToGetReviveStone,null,function(retData){
            if(bShowTips) {
                var msg;
                if(retData.code == ECode.OK)
                    msg = "分享成功";
                else
                    msg = "今日已分享";
                UIMgr.getInstance().showTips(msg);
            }
        });
    }

    p.sendWatchAdToGetGold = function(type) {
        NetMgr.getInstance().send(RPC.C2S_WatchAdToGetGold,{type:type});
        if(typeof(TalkingData) != "undefined")
            TalkingData.TrackingMoney(type, '看广告得金币');
    }

    p.rpcBuyBuff = function(buffId) {
        NetMgr.getInstance().rpc(RPC.C2S_BuyBuff,{buffId:buffId},function(retData){
            var isOk = retData.code == ECode.OK;
            if(isOk){
                GameMgr.getInstance().getRolePlayer().activeBuff(retData.buffId);
            }
        });
    }

    p.rpcUseReviveStone = function() {
        NetMgr.getInstance().rpc(RPC.C2S_UseReviveStone,null,function(retData){
            var isOk = retData.code == ECode.OK;
            EventMgr.getInstance().event(EEvent.UseReviveStoneResult,isOk);
        });
    }

    p.rpcBattleResult = function(gameMode,score,task,goldRatio,callbackHdl) {
        NetMgr.getInstance().rpc(RPC.C2S_UploadBattleResult,{battleType:gameMode,score:score,task:task,goldRatio:goldRatio},function(retData){
            console.log("rpcBattleResult",retData);
            if(retData.star != null) {
                var user = GameData.getInstance().user;
                user.setStar(retData.star);
                user.saveToStorage();
            }
            if(callbackHdl != null)
                callbackHdl.run();
        });
    }

    p.sendName = function(name){
        NetMgr.getInstance().rpc(RPC.C2S_UploadName,{name:name},function(ret){
            // console.log("sendName",ret);
        });
    }

    p.rpcDailyPrize = function(prize){
        NetMgr.getInstance().rpc(RPC.C2S_DailyPrize,{prize:prize},function(ret){
            // console.log("rpcDailyPrize",ret);
        });
    }

    p.sendShopBuy = function(id,cnt) {
        NetMgr.getInstance().send(RPC.C2S_ShopBuy,{id:id,cnt:cnt});
    }

    p.rpcGrowProp = function(id) {
        NetMgr.getInstance().rpc(RPC.C2S_GrowProp,{id:id},function(ret){
            console.log("rpcGrowProp",ret);
            if(ret.code == ECode.OK){
                GameData.getInstance().user.AddGowLv(ret.id);
                UIMgr.getInstance().showTips("属性升级成功");
            }
            else {
                UIMgr.getInstance().showTips("金币不足");
            }
        });
    }

    p.rpcCostGold = function(cost){
        NetMgr.getInstance().rpc(RPC.C2S_CostGold,{cost:cost},function(ret){
            console.log("rpcCostGold",ret);
            if(ret.code == ECode.OK){
            }
        });
    }

    /*********************** Handler ********************************/
    p.onUpdateGoods = function(data) {
        GameData.getInstance().goods.updateWidthData(data);
        // console.log("onUpdateGoods", data);
        EventMgr.getInstance().event(EEvent.Player_Goods_Update);
    }

    p.onResetDailyData = function(data) {
        var goods = GameData.getInstance().goods;
        goods.dailyShareCnt = data.dailyShareCnt;
        goods.dailyPrize = data.dailyPrize;
    }

    p.onResetMonthlyData = function(data) {
        var user = GameData.getInstance().user;
        user.setStar(data.star);
    }

    return ServerAgency;
})();

ServerAgency._instance = null;