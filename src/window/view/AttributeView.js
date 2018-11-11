
var AttributeView = (function (_super) {
    function AttributeView() {
        AttributeView.__super.call(this);
    }

    Laya.class(AttributeView,'view.AttributeView',_super);
    var p = AttributeView.prototype;

    p.init = function(data) {
        EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().on(EEvent.CloseShowAd,this,this.onCloseShowAd);
        EventMgr.getInstance().on(EEvent.ShareSuccess,this,this.onShareSuccess);
        EventMgr.getInstance().on(EEvent.Player_Grow_Update,this,this.refreshGrowPropInfo);
        EventMgr.getInstance().on(EEvent.Player_Goods_Update,this,this.onPlayerGoodsUpdate);

        this.m_data = data;
        var name = data.start ? "start":"settlement";
        this.m_box = this.getChildByName(name);
        this.m_box.getChildByName("closeBtn").on(Laya.Event.CLICK,this,this.onClose);
        if(!data.start) {
            this.m_box.getChildByName("againBtn").on(Laya.Event.CLICK,this,this.onAgain);
            this.getChildByName("start").visible = false;
            this.onPlayerGoodsUpdate();
        }
        else {
            this.getChildByName("settlement").visible = false;
        }

        this.refreshGrowPropInfo();
    }

    p.uninit = function(){
        EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
		EventMgr.getInstance().off(EEvent.CloseShowAd,this,this.onCloseShowAd);
        EventMgr.getInstance().off(EEvent.ShareSuccess,this,this.onShareSuccess);
        EventMgr.getInstance().off(EEvent.Player_Grow_Update,this,this.refreshGrowPropInfo);
        EventMgr.getInstance().off(EEvent.Player_Goods_Update,this,this.onPlayerGoodsUpdate);
    }

    p.onClose = function(){
        UIMgr.getInstance().closeUI(EUI.AttributeView);
        if(!this.m_data.start) {
            GameMgr.getInstance().exitBattle();
        }
    }

    p.setBoxInfo = function(name,id,lv){
        var box = this.m_box.getChildByName(name);
        var curCfg = DataMgr.getInstance().getGrowPropCfg(id,lv);
        var nextCfg = DataMgr.getInstance().getGrowPropCfg(id,lv+1);
        var lvLbl = box.getChildByName("lv");
        lvLbl.text = "LV."+lv;
        var tipsLbl = box.getChildByName("tips");
        var str = null;
        var name = curCfg&&curCfg.name||nextCfg.name;
        var buffval = curCfg&&curCfg.buffval||0;
        if(nextCfg != null) {
            str = name+"+"+buffval+"% ➝ "+nextCfg.buffval+"%";
        }
        else {
            str = name+"+"+buffval+"%(满级)";
        }
        tipsLbl.text = str;

        var btn = box.getChildByName("btn");
        if(nextCfg == null) {
            btn.visible = false;
        }
        else {
            btn.visible = true;
            var btnInfo = btn.getChildByName("btnInfo");
            var goldIcon = btn.getChildByName("gold");
            if(nextCfg.video!=0) {
                btn.skin = "AttributeView/lvlup_ad.png";
                btnInfo.text = "免费";
                goldIcon.skin = "AttributeView/ad.png";
            }
            else if(nextCfg.share!=0) {
                btn.skin = "AttributeView/lvlup_ad.png";
                btnInfo.text = "免费";
                goldIcon.skin = "AttributeView/share.png";
            }
            else {
                btn.skin = "AttributeView/lvlup_gold.png";
                btnInfo.text = nextCfg.cost;
                goldIcon.skin = "AttributeView/gold_icon.png";
            }
        }

        this.m_idCfgMap = this.m_idCfgMap||{};
        this.m_idCfgMap[id] = nextCfg;
    }

    p.onBtnClick = function(id){
        this.m_clickId = id;
        var cfg = this.m_idCfgMap[id];
        if(cfg==null) return;

        if(cfg.cost > 0) {
            this.onLvupSuccess();
        }
        else if(cfg.video > 0) {
            SDKMgr.getInst().showVideoAd();
        }
        else {
            var _this = this;
            SDKMgr.getInst().inviteFriends(function(retCode){
                if(retCode == 0)
                    _this.onLvupSuccess();
            });
        }
    }

    p.onShowAdCompleted = function(){
        this.onLvupSuccess();
    }

    p.onCloseShowAd = function(){
    }

    p.onShareSuccess = function(){
        // this.onLvupSuccess();
    }

    p.onLvupSuccess = function(){
        if(this.m_clickId == null) return;
        ServerAgency.getInstance().rpcGrowProp(this.m_clickId);
        this.m_clickId = null;
    }

    p.refreshGrowPropInfo = function(){
        for(var id=1;id<=5;id++) {
            var name = "item"+id;
            var box = this.m_box.getChildByName(name);
            box.getChildByName("btn").on(Laya.Event.CLICK,this,this.onBtnClick,[id]);
            var lv = GameData.getInstance().user.getGrowLv(id);
            this.setBoxInfo(name,id,lv);
        }
    }

    p.onAgain = function(){
        UIMgr.getInstance().closeUI(EUI.AttributeView);
        var isGrade = GameMgr.getInstance().isGradeMode();
        GameMgr.getInstance().exitBattle(true);
        if(isGrade) {
            GameMgr.getInstance().prepareBattle(GameMode.Grade);
            SDKMgr.getInst().report(ReportType.Start_Fight);
        }
        else {
            GameMgr.getInstance().prepareBattle(GameMode.Endless);
            SDKMgr.getInst().report(ReportType.Start_Fight);
        }
    }

    p.onPlayerGoodsUpdate = function(){
        if(this.goldTxt) {
            var goods = GameData.getInstance().goods;
            this.goldTxt.text = ""+goods.gold;
        }
    }

    return AttributeView;
}(AttributeViewUI));