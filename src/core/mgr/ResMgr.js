/*
* 资源管理器
*/
var ResMgr = (function () {
    function ResMgr() {
        this.reset();
        this.onlineVideoShareCfg = null;
        this.fetchCDNCfg();
    }

    ResMgr.getInstance = function () {
        if (ResMgr._instance == null) {
            ResMgr._instance = new ResMgr();
        }
        return ResMgr._instance;
    };

    var p = ResMgr.prototype;

    p.fetchCDNCfg = function(){
        if(SDKMgr.IsWebChat()) {
			var http = new HttpLaya(function(err, data) {
				// console.log("onlineVideoShareCfg:"+JSON.stringify(data));
				if(err != null) {
					console.log(err);
				}
				else {
                    ResMgr.getInstance().onlineVideoShareCfg = data;
                    EventMgr.getInstance().event(EEvent.LoadOnlineVideoCfgOk);
				}
			});
			http.sendGetWithUrl(GameConst.CDN+"onlineVideoShareCfg.json?t="+Date.now());
		}
    }

    p.reset = function() {
        this.m_loadingRes = false;
        this.templet  = null;
        this.m_loaded = false;
    }

    p.loadBattleRes = function(callback){
        if(this.m_loadingRes) return;

        this.m_loadBattleResCallback = callback;

        this.m_loadingRes = true;

        this.templet = new Laya.Templet();
        this.templet.on(Laya.Event.COMPLETE,this,this.onLoadAnimComplete);
        this.templet.on(Laya.Event.ERROR,this,this.onError);

        if(ResPreload.AnimList.length > 0)
            this.templet.loadAni(ResPreload.AnimList[0]);
        else{
            this.onLoadAnimComplete();
        }
    }

    p.onProgress = function(value) {
        EventMgr.getInstance().event(EEvent.Res_Load_Progress,value); 
    }

    p.onLoadComplete = function(){
        this.m_loadingRes = false;

        try {
            TimerUtil.once(500,this,this.closeLoadingView);
        } catch (error) {
            EventMgr.getInstance().event(EEvent.Error,error);
        }

        DataMgr.getInstance().loadClientData();
        this.m_loaded = true;
    }

    p.closeLoadingView = function() {
        EventMgr.getInstance().event(EEvent.ResourceLoaded);
        UIMgr.getInstance().closeUI(EUI.Loading);
        UIMgr.getInstance().openUI(EUI.Start);
        // UIMgr.getInstance().openUI(EUI.HXLoginView);
    }

    p.onLoad = function() {
        this.m_loadingRes = false;

        if(GameConst.Online) {
            NetMgr.getInstance().rpc(RPC.C2S_Enter_Room,null,function(data){
                if(data.code == ECode.OK) {
                    GameMgr.getInstance().enterOnlineBattle(data);
                }
            });
        }
        else {
           GameMgr.getInstance().enterBattle();
        }
    }

    p.onLoadAnimComplete = function(){
        this.m_loadBattleResCallback && this.m_loadBattleResCallback.run();

        Laya.loader.load(ResPreload.url, Laya.Handler.create(this,this.onLoadComplete), Laya.Handler.create(this, this.onProgress, null, false),null,1,true);
    }

    p.onError = function(){
        console.log("加载动画失败");
    }

    p.getSkeleton = function(){
        var skeleton = this.templet.buildArmature(1);
        skeleton.pos(0,0);
        return skeleton;
    }

    p.clear = function(){
        if(this.templet!=null){
            this.templet.off(Laya.Event.COMPLETE,this,this.onLoadAnimComplete);
            this.templet.off(Laya.Event.ERROR,this,this.onError);
            this.templet.destroy();
            this.templet = null;
        }
    }

    return ResMgr;
}());

ResMgr._instance = null;