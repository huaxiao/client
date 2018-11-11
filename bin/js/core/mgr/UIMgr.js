/*
* UI管理器
*/

var UIMgr =(function () {
    var _gameMapZorder = 0;
    var _viewZorder = 1000;
    var _loadingViewZorder = 2999;
    var _tipsZorder = 3000;
    var _dialogZorder = 3100;
    var _maskZorder = 3100;

     function UIMgr() {
        this.reset();
        this.m_hideBanner = false;
    }

     /**
     * 单例
     */
    UIMgr.getInstance = function(){
        if(UIMgr._instance == null){
            UIMgr._instance = new UIMgr();
            UIMgr._instance.init();
        }
        return UIMgr._instance;
    }

    var p = UIMgr.prototype;

    p.init = function() {
        Laya.stage.on(Laya.Event.RESIZE,this, this.onScreenResize);

        EventMgr.getInstance().on(EEvent.Error,this,this.showError);
        if(GameConst.Debug) {
            var txt = new Laya.TextArea();
            txt.x = 200;
            txt.width = 800;
            txt.height = 120;
            txt.fontSize = 22;
            txt.color = "#FFFFFF";
            Laya.stage.addChild(txt);
            txt.zOrder = 5000;
            UIMgr._debugTxt = txt;
            // EventMgr.getInstance().on(EEvent.Error,this,this.showError);
        }
    }

    p.addAdapter = function(adpater){
        this.adpaterArray.push(adpater);
    }

    p.clearAdapterOnUI = function(ui){
        var adpater = null;
        var uiname = ui.uiname;
        for(var i = this.adpaterArray.length - 1; i >=0;i--){
            adpater = this.adpaterArray[i];
            if(adpater.uiname == uiname){
                this.adpaterArray.splice(i,1);
            }
        }
    }

    p.onScreenResize = function(){
        var temp = null;
        for(var i = this.adpaterArray.length - 1; i >=0;i--){
            temp = this.adpaterArray[i];
            temp.adapter();
        }
    }

    p.showError = function(error){
        var str = typeof error == "object" ? JSON.stringify(error) : error;
        // console.error(str);
        this.m_debugStr = this.m_debugStr || "";
        this.m_debugStr += str;
        if(UIMgr._debugTxt != null) {
            UIMgr._debugTxt.text = this.m_debugStr;
        }
    }

    p.reset = function(){
        this.uiArray = [];
        this.adpaterArray = [];
    }

    //添加ui
    p.pushUI = function (ui) {
        this.uiArray.push(ui);
    };

    p.toUI = function (uiname,param) {
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            this.uninitUI(ui);
        }
        this.uiArray.length = 0;

        this.openUI(uiname,param);
    };

    p.openUIUnique = function(uiname,param,vis) {
        if(this.isUIOpen(uiname) == false) {
            this.openUI(uiname,param,vis);
        }
    }

    p.checkBanner = function(){
        if(CheckIPMgr.getInstance().isShowingBanner()){
            CheckIPMgr.getInstance().hideBanner();
            this.m_hideBanner = true;
        }
    }

    p.openUI = function(uiname,param,vis) {
        this.checkBanner();
        if(uiname.res != null) {
            Laya.loader.load(uiname.res,Laya.Handler.create(null,function() {
                UIMgr.getInstance().createUI(uiname,param,vis)
            }));
        }
        else {
            this.createUI(uiname,param,vis)
        }
    }

    p.createUI = function(uiname,param,vis) {
        // console.log("createUI",uiname);

        (vis===void 0)&& (vis=true);
        var ui = new uiname.cls();
        if (ui != undefined) {
            ui.uiname = uiname;
            switch(uiname) {
                case EUI.GameMap:
                    ui.zOrder = _gameMapZorder;
                    break;
                case EUI.Loading:
                    ui.zOrder = _loadingViewZorder;
                    break;
                case EUI.DailyReviveView:
                    ui.zOrder = 2000;
                    break;
                case EUI.VideoFailView:
                    ui.zOrder = 2001;
                    break;
                default:
                    ui.zOrder = _viewZorder++;
                    break;
            }

            Laya.stage.addChild(ui);
            this.pushUI(ui);            
            ui.visible = vis;

            if(vis)
                CheckIPMgr.getInstance().showBanner(uiname.id);

            if(ui.init != null && vis)
                ui.init(param);
        }
    }   
    
    p.closeUI = function(uiname) {
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.uiname == uiname)
            {
                this.uninitUI(ui);
                this.uiArray.splice(i,1);
                break;
            }
        }
        if(this.m_hideBanner && this.uiArray.length == 1){
            CheckIPMgr.getInstance().restoreBanner();
            this.m_hideBanner = false;
        }
    }

    p.isUIOpen = function(uiname){
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.uiname == uiname)
            {
                return true;
            }
        }
        return false;
    }

    p.showUI = function(uiname,param){
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.uiname == uiname)
            {
                if(ui.init != null)
                    ui.init(param);
                ui.visible = true;
                ui.zOrder = _viewZorder++;
                CheckIPMgr.getInstance().showBanner(uiname.id);
                return true;
            }
        }
        return false;
    }

    p.hideUI = function(uiname){
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.uiname == uiname)
            {
                ui.visible = false;
                break;
            }
        }
    }

    p.findUI = function(uiname) {
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.uiname == uiname)
            {
                return ui;
            }
        }
        return null;
    }

    p.uninitUI = function(ui){
        this.clearAdapterOnUI(ui);

        if(ui.uninit!=null)
            ui.uninit();

        Laya.timer.clearAll(ui);

        ui.removeSelf();
        ui.destroy();
    }

    p.update = function(){
        for (var i = this.uiArray.length - 1; i >= 0; i--) {
            var ui = this.uiArray[i];
            if(ui.update != null)
                ui.update();
        }
    }

    p.showDialog = function(msg,callback) {
        var ui = new DialogView(msg,callback);
        Laya.stage.addChild(ui);
        ui.zOrder = _dialogZorder;
    }

    p.showMask = function(isShow) {
        if(isShow && this.maskView == null) {
            var maskArea = new Laya.Sprite();
            this.maskView = maskArea;
            maskArea.graphics.drawRect(-530, -180, 2340, 1080, "#949494");
            maskArea.alpha = 0.5;
            maskArea.mouseThrough = false;
            maskArea.mouseEnabled = true;
            var hitArea = new Laya.HitArea();
            hitArea.hit.drawRect(0, 0, Laya.stage.width, Laya.stage.height, "#000000");

            maskArea.hitArea = hitArea;
            maskArea.zOrder = _dialogZorder;
            Laya.stage.addChild(this.maskView);
        }
        else if(!isShow && this.maskView != null) {
            this.maskView.removeSelf();
            this.maskView.destroy();
            this.maskView = null;
        }
    }

    p.showTips = function(msg,flipMS,fontSize,fontColor) {
        var tips = this.m_arrTips;
        var txt;
        if(tips == null) {
            tips = [];
            var box = new Laya.Box();
            Laya.stage.addChild(box);
            box.zOrder = _tipsZorder;
            for(var i=0; i<3; i++) {
                txt = new Laya.Text();
                txt.fontSize = 24;
                txt.color = "#FFFFFF";
                txt.width = 600;
                txt.height = 50;
                txt.align = "center";
                txt.valign = "middle";
                txt.visible = false;
                txt.centerX = 0;
                tips.push(txt)
                box.addChild(txt);
            }
            this.m_arrTips = tips;
            box.width = 600;
            box.centerX = 0;
        }
        if(tips.length == 0)
            return;

        txt = tips.shift()
        txt.text = msg;
        flipMS = flipMS || 600;
        txt.fontSize = fontSize || 24;
        txt.color = fontColor || "#FFFFFF";
        txt.visible = true;
        txt.y = 200;
        Laya.Tween.to(txt,{y:150},flipMS,null,Laya.Handler.create(this,function(obj){
            obj.visible=false;
            tips.push(obj);
        },[txt]));
    }

    return UIMgr;    
}());

UIMgr._instance = null;