/*
* StartView 开始界面;
*/
var StartView = (function (_super) {
    function StartView() {
        StartView.__super.call(this);
        this.m_clickBegin = false;
        this.m_rankArrList = [];
        this.m_buyBuffId = 0;
        this.m_leftADCDTime = 0;
        this.m_watchADCDTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.VideaCDTime);
        this.m_startWatchTimer = false;

        this.moreNode = null;
        this.m_drawerskeleton = null;
        this.m_showDrawer = false;
        this.m_skeleton = null;
    }

    Laya.class(StartView,'view.StartView',_super);
	var p = StartView.prototype;

    p.registerEvent = function(){
        this.playBtn.on(Laya.Event.MOUSE_DOWN,this,this.onPlayBtnClick);
        this.rankBtn.on(Laya.Event.CLICK,this,this.onRankBtnClick);
        this.shareBtn.on(Laya.Event.CLICK,this,this.onShareBtnClick);
        this.buyStoneBtn.on(Laya.Event.CLICK,this,this.onbuyStoneBtnClick);
        this.watchAdBtn.on(Laya.Event.CLICK,this,this.onWatchAdBtnClick);
        this.buff1Btn.on(Laya.Event.CLICK,this,this.onBuff1BtnClick);
        this.buff2Btn.on(Laya.Event.CLICK,this,this.onBuff2BtnClick);
        this.EndlessBtn.on(Laya.Event.MOUSE_DOWN,this,this.onEndlessBtnClick);
        this.OtherBtn.on(Laya.Event.MOUSE_DOWN,this,this.onOtherBtnClick);
        this.StrongBtn.on(Laya.Event.MOUSE_DOWN,this,this.onStrongBtnClick);
        this.SkinBtn.on(Laya.Event.CLICK,this,this.onShowSkinBtn);
        this.setting.on(Laya.Event.CLICK,this,this.onSettingClick);
        this.prepare.on(Laya.Event.CLICK,this,this.onPrepareClick);
        this.drawerBtn.on(Laya.Event.CLICK,this,this.onShowHideDrawer)

        for(var i=0; i<3; i++) {
            var btn = this.downBtn.getChildByName("buff"+i);
            if(btn!=null)
                btn.on(Laya.Event.CLICK,this,this.onBuffClick,[i+1]);
        }

        EventMgr.getInstance().on(EEvent.PrepareBattleCompleted,this,this.onPrepareBattleOk);
        EventMgr.getInstance().on(EEvent.Player_Goods_Update,this,this.onPlayerGoodsUpdate);
        EventMgr.getInstance().on(EEvent.RefreshFriendRank,this,this.onRefreshMinFriendData);
        EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().on(EEvent.RefreshAdCDTime,this,this.checkWatchAdTime);
        EventMgr.getInstance().on(EEvent.StartViewShowFriendRank,this,this.onShowFriendRank);
        EventMgr.getInstance().on(EEvent.Player_Star_Update,this,this.onPlayerStarUpdate);
        EventMgr.getInstance().on(EEvent.SwitchSkin,this,this.showSkin);
        EventMgr.getInstance().on(EEvent.Player_Grow_Update,this,this.refreshGrowPropInfo);
        EventMgr.getInstance().on(EEvent.Player_SkinChip_Update,this,this.refreshSkinChip);
    }

    p.unregisterEvent = function(){
        this.playBtn.off(Laya.Event.MOUSE_DOWN,this,this.onPlayBtnClick);
        this.rankBtn.off(Laya.Event.CLICK,this,this.onRankBtnClick);
        this.shareBtn.off(Laya.Event.CLICK,this,this.onShareBtnClick);
        this.buyStoneBtn.off(Laya.Event.CLICK,this,this.onbuyStoneBtnClick);
        this.watchAdBtn.off(Laya.Event.CLICK,this,this.onWatchAdBtnClick);
        this.buff1Btn.off(Laya.Event.CLICK,this,this.onBuff1BtnClick);
        this.buff2Btn.off(Laya.Event.CLICK,this,this.onBuff2BtnClick);
        this.EndlessBtn.off(Laya.Event.MOUSE_DOWN,this,this.onEndlessBtnClick);
        this.SkinBtn.off(Laya.Event.CLICK,this,this.showSkin);
        this.drawerBtn.off(Laya.Event.CLICK,this,this.onShowHideDrawer)

        EventMgr.getInstance().off(EEvent.Player_Goods_Update,this,this.onPlayerGoodsUpdate);
        EventMgr.getInstance().off(EEvent.RefreshFriendRank,this,this.onRefreshMinFriendData);
        EventMgr.getInstance().off(EEvent.PrepareBattleCompleted,this,this.onPrepareBattleOk);
        EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().off(EEvent.RefreshAdCDTime,this,this.checkWatchAdTime);
        EventMgr.getInstance().off(EEvent.StartViewShowFriendRank,this,this.onShowFriendRank);
        EventMgr.getInstance().off(EEvent.Player_Star_Update,this,this.onPlayerStarUpdate);
        EventMgr.getInstance().off(EEvent.SwitchSkin,this,this.showSkin);
        EventMgr.getInstance().off(EEvent.Player_Grow_Update,this,this.refreshGrowPropInfo);
        EventMgr.getInstance().off(EEvent.Player_SkinChip_Update,this,this.refreshSkinChip);
    }

    p.init = function(){
        this.registerEvent();
        this.Buff1Ani.stop();
        this.Buff2Ani.stop();

        if(this.buff1Effect!=null)
            this.buff1Effect.visible = false;

        if(this.buff2Effect!=null)
            this.buff2Effect.visible = false;

        SoundMgr.getInstance().playBgm();

        SDKMgr.getInst().getNickName(Laya.Handler.create(this,this.setNickName));
        SDKMgr.getInst().getHead(Laya.Handler.create(this,this.setHeadIcon));


        this.refreshHeadInfo();
        this.onPlayerGoodsUpdate();
        this.refreshSkinChip();

        if(this.isSuportDom()) {
            this.createAddQQGroupHref();
            this.fitDOMElements();
            Laya.stage.on(Laya.Event.RESIZE, this, this.fitDOMElements);
            this.QQGroupText.mouseEnabled = false;
        }
        else {
            // this.QQGroupLbl.text = "交流群：";
            this.QQGroupText.mouseEnabled = false;
            //屏蔽点击事件
            // this.qqGroupStr = this.QQGroupText.text;
            // this.QQGroupText.on(Laya.Event.FOCUS,this,this.showQQGroupTips);
            // this.QQGroupText.on(Laya.Event.INPUT,this,this.setQQNumberText);
        }

        this.checkWatchAdTime();
        
        this.initSdk();

        Utils.checkVideoBtn(this.watchAdBtn);
    }

    p.initSdk = function(){
        if(SDKMgr.IsWebChat() && typeof(wx) != "undefined") {
            var designRatio = Laya.stage.designWidth / Laya.stage.designHeight;
            var ratio = Laya.stage.width / Laya.stage.height;
            var px = this.friendRankBox.x;
            if(ratio >= 2)
                px = +(132 / 2436 * Laya.stage.width);
            
            //微信排行榜只能在开放域中获取
            this.rankBoxInitX = px;
            this.rankBoxHideX = px - 400;
            this.friendRankBox.x = this.rankBoxHideX;
            this.onShowFriendRank();

            this.moreNode = AladinSDK.getMoreNode();
            this.moreNode.x = 0;
            this.moreNode.y = 0;
			this.linkNode.addChild(this.moreNode);  //获取更多好玩节点
            AladinSDK.ShowMore();

            this.m_drawerskeleton = new Laya.Skeleton();
            this.dragonbones.addChild(this.m_drawerskeleton);
            this.m_drawerskeleton.pos(0,0);
            this.m_drawerskeleton.load("res/drawer/NewProject.sk");
            this.m_showDrawer = false;

            // CheckIPMgr.getInstance().showBanner(1);
            if(UIMgr.getInstance().isUIOpen(EUI.DailyReviveView)){
                UIMgr.getInstance().checkBanner();
            }
        }
        this.friendRankSp.visible = false;

        this.initSkinInfo();

        var needCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.EndlessNeedFightCnt) || 2;
        var isLock = GameMgr.getInstance().GetBattleCnt() < needCnt;
        this.EndlessBtn.getChildByName("lock").visible = isLock;
        this.EndlessBtn.getChildByName("open").visible = !isLock;
    }

    p.initSkinInfo = function(){
        this.m_skinAdArr = [];
        this.showSkin(SkinMgr.getInstance().usingSkinId());
        if(SkinMgr.getInstance().hasUnOwnedSkin()){
            this.skinLeftTimeBox.visible = true;
            this.skinLeftTime.text = "获取新皮肤";
        }else{
            this.skinLeftTimeBox.visible = false;
        }

        if(this.m_skinSkeleton == null){
            this.m_skinSkeleton = ResMgr.getInstance().getSkeleton();
            this.m_skinSkeleton.rotation = 90;
            this.m_skinSkeleton.scale(0.5,0.5);
            this.m_skinSkeleton.pos(this.SkinBtn.width/2,this.SkinBtn.height/2-9);
            this.SkinBtn.addChild(this.m_skinSkeleton);
            this.m_skinSkeleton.zOrder = -1;
            this.m_skinSkeleton.play("headskin1_run",true,true);
        }
    }

    p.refreshRankView = function(){
        this.callCnt++;
        this.clearTexture();

        this.rankTexture = new Laya.Texture(Laya.Browser.window.sharedCanvas); 
        this.friendRankSp.graphics.clear();
        this.friendRankSp.graphics.drawTexture(this.rankTexture);
        if(this.callCnt == 10){
            Laya.timer.clear(this, this.refreshRankView); 
        }
    }

    p.onShowFriendRank = function(){    
        if(!SDKMgr.IsWebChat() || !GameConst.SupportOpenDomain)
            return;
        
        this.topRankList.visible = false;
        this.friendRankSp.visible = true;
        var openDataContext = wx.getOpenDataContext();
        var sharedCanvas = openDataContext.canvas;
        sharedCanvas.width = this.friendRankSp.width;
        sharedCanvas.height = this.friendRankSp.height;
        SDKMgr.getInst().showFriendRank("min",RankType.Grade);   
        this.friendRankBox.visible = true;
        Laya.timer.once(100, this, function(){
            this.friendRankSp.graphics.clear();
            this.friendRankSp.visible = true;
            this.callCnt = 0;
            Laya.timer.loop(200, this, this.refreshRankView); 
        }); 
    }

    p.onHideFriendRank = function(){
        if(!SDKMgr.IsWebChat())
            return;
        // Laya.Tween.to(this.friendRankBox,{x:this.rankBoxHideX},500,null,Laya.Handler.create(this,function(obj){
        //     this.friendRankSp.visible = false;
        // }));
        
        this.friendRankBox.visible = false;
        Laya.timer.clear(this, this.refreshRankView); 
    }

    p.onRefreshMinFriendData = function(){
        var list = RankMgr.getInstance().FriendRankList();
        this.m_rankArrList.length = 0;
        var data = null,url;
        for(var i =0; i < 5 && i < list.length;i++){
            data = list[i];
            url = data.url;
            if((url == null || url == "") && data.selfFlag)
            {
                url = GameData.getInstance().headIconUrl;
            }
            this.m_rankArrList.push({imgUrl:url});
        }

        this.topRankList.array = this.m_rankArrList;   
        this.topRankList.renderHandler = new Laya.Handler(this,this.onRankListRender);

        this.topRankList.visible = true;
    }

    p.onRankListRender = function(item,index){
        if(index < 0 || index>= this.m_rankArrList.length) return;

        var url = this.m_rankArrList[index].imgUrl;

        var icon = item.getChildByName("icon");
        if(icon != null){
             icon.graphics.clear();
             icon.loadImage(url,0,0,icon.width,icon.height);
        }

        var rank = item.getChildByName("rank");
        if(rank!=null){
            rank.skin = "broadcast/" + (index+1) + ".png";;
        }
    }

    p.refreshHeadInfo = function(){
        SDKMgr.getInst().getNickName(Laya.Handler.create(this,this.setNickName));
        SDKMgr.getInst().getHead(Laya.Handler.create(this,this.setHeadIcon));

        this.onPlayerStarUpdate();
    }

    p.setNickName = function(name){
        this.name.text = name;
        GameData.getInstance().user.setUname(name,false);        
    }

    p.setHeadIcon = function(imgUrl){
        this.headicon.loadImage(imgUrl,0,0,this.headicon.width,this.headicon.height);
        GameData.getInstance().headIconUrl = imgUrl;
    }

    p.onPlayerStarUpdate = function(){
        var user = GameData.getInstance().user;
        var grade = user.grade;
        var cfg = DataMgr.getInstance().getUserGradeCfg(grade);
        if(cfg == null) return;

        this.gradeIcon.skin = cfg.icon;
        var starCnt = user.getGradeStar();
        if(grade == DataMgr.getInstance().getMaxUserGrade()) {
            this.starBox.visible = false;
            this.maxGradeBox.visible = true;
            this.starCnt.text ="x"+ starCnt ;
        }
        else {
            this.maxGradeBox.visible = false;
            this.starBox.visible = true;
            for(var i=0; i<3; i++) {
                this['star'+i].skin = i < starCnt ? "startui/RankStar1.png" : "startui/RankStar2.png";
            }
        }
    }

    p.buyBuff = function(){
        if(this.m_buyBuffId > 0)
            ServerAgency.getInstance().rpcBuyBuff(this.m_buyBuffId);
        this.m_buyBuffId = 0;
    }

    p.onPlayBtnClick = function() {
        if(this.m_clickBegin) return;

        this.m_clickBegin = true;

        SoundMgr.getInstance().playUIClick();
        GameMgr.getInstance().prepareBattle(GameMode.Grade);
        this.buyBuff();
    }

    p.onEndlessBtnClick = function(){
        var needCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.EndlessNeedFightCnt) || 2;
        if(GameMgr.getInstance().GetBattleCnt() < needCnt){
            UIMgr.getInstance().showTips(DataMgr.getInstance().getContentById(18));
            return;
        }

        if(this.m_clickBegin) return;

        this.m_clickBegin = true;

        SoundMgr.getInstance().playUIClick();
        GameMgr.getInstance().prepareBattle(GameMode.Endless);
        this.buyBuff();
    }

    p.onPrepareBattleOk = function(){
        this.gotoBattle();
    }

    p.gotoBattle = function(){
        var buffId = parseInt(Laya.LocalStorage.getItem("videoBuffId")) || 0;
        if(buffId > 0)
            GameMgr.getInstance().m_role.setBuffState(buffId);
        UIMgr.getInstance().toUI(EUI.MainView);

        UIMgr.getInstance().openUI(EUI.InvincibleView,null,false);
        if(GameMgr.getInstance().isGradeMode())
            UIMgr.getInstance().openUI(EUI.OneLifeView,null,false);
        else if(GameMgr.getInstance().isEndlessMode())
            UIMgr.getInstance().openUI(EUI.EndlessOneLifeView,null,false);
        GameMgr.getInstance().enterBattle();
    }

    p.onRankBtnClick = function() {
        this.onHideFriendRank();
        UIMgr.getInstance().openUI(EUI.RankView);
    }

    p.onShareBtnClick = function() {
        CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.ShareToGainStone);
    }

    p.isSuportDom = function() {
        return SDKMgr.IsQQPlay() || SDKMgr.IsQQHall();
    }

    p.createAddQQGroupHref = function() {
        var div = Laya.Browser.createElement("div");
        div.style.zIndex = Laya.Render.canvas.zIndex + 1;
        div.style.width = this.QQGroup.width;
        Laya.Browser.document.body.appendChild(div);
        div.id = "btn";
        div.onclick=function(){
            if(typeof(window) != "undefined")
            {
                window.open("https://jq.qq.com/?_wv=1027&k=5VNZHKg");
            }
            else
            {
                try {
                    window.clipboardData.setData("Text","817965113");
                    UIMgr.getInstance().showTips("复制成功，搜索QQ群");
                } catch (error) {
                    UIMgr.getInstance().showTips("系统不支持复制，请手动加QQ群");
                }
            }
        };
        this.hrefDom = div;
    }

    p.fitDOMElements = function() {
        Laya.Utils.fitDOMElementInArea(this.hrefDom, this.QQGroup, 0, 0, this.QQGroup.width, this.QQGroup.height);
    }

    p.setQQNumberText = function() {
        this.QQGroupText.text = this.qqGroupStr;
    }

    p.showQQGroupTips = function() {
        UIMgr.getInstance().showTips("请全选复制QQ号，手动加群",3000,40);
    }

    p.onWatchAdBtnClick = function(){
        if(this.m_leftADCDTime > 0)
        {
            UIMgr.getInstance().showTips("CD时间未到");
            return;
        }

        this.m_clickedWatchAdBtn = true;
        CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.FourHourGold);
    }

    p.checkWatchAdTime = function(){
        var nextTime = GameData.getInstance().goods.lastGoldTime * 0.001 + this.m_watchADCDTime;

        this.m_leftADCDTime= parseInt(nextTime- Date.now() * 0.001);
        if(this.m_leftADCDTime < 0) 
            this.m_leftADCDTime = 0;

        if(this.m_startWatchTimer) return;  //定时器正在处理

        if(this.m_leftADCDTime > 0){
            this.m_startWatchTimer = true;
            this.refreshADCDTime();
            Laya.timer.loop(1000,this,this.refreshADCDTime);
            this.coldtime.visible = true;
        }else
        {
            this.coldtime.visible = false;
        }
    }

    p.refreshADCDTime = function(){
        this.coldtime.text = StringUtil.formatSeconds(this.m_leftADCDTime);
        this.m_leftADCDTime = this.m_leftADCDTime-1;
        if(this.m_leftADCDTime  == 0)
        {
            Laya.timer.clear(this,this.refreshADCDTime);
            this.coldtime.visible = false;
            this.m_startWatchTimer = false;
        }
    }

    p.onShowAdCompleted = function(pos){
        if(pos == ShareVideoPos.FourHourGold){
            if(this.m_clickedWatchAdBtn != true) return;
            this.m_clickedWatchAdBtn = false;
            ServerAgency.getInstance().sendWatchAdToGetGold(1);
        }
    }

    p.onBuff1BtnClick = function(){
        if(this.m_buyBuffId != 1){
            if(this.checkGold(1)){
                this.m_buyBuffId  = 1;
                this.Buff1Ani.play(0,true);
                if(this.buff1Effect!=null) this.buff1Effect.visible = true;

                this.Buff2Ani.stop();
                if(this.buff2Effect!=null) this.buff2Effect.visible = false;
            }
        }
        else{
            this.m_buyBuffId  = 0;
            this.Buff1Ani.stop();
            if(this.buff1Effect!=null) this.buff1Effect.visible = false;
        }
    }

    p.onBuff2BtnClick = function(){
        if(this.m_buyBuffId != 2){
            if(this.checkGold(2)){
                this.m_buyBuffId = 2;
                this.Buff1Ani.stop();
                if(this.buff1Effect!=null) this.buff1Effect.visible = false;

                this.Buff2Ani.play(0,true);
                if(this.buff2Effect!=null) this.buff2Effect.visible = true;
            }
        }else{
            this.m_buyBuffId  = 0;
            this.Buff2Ani.stop();
            if(this.buff2Effect!=null) this.buff2Effect.visible = false;
        }
    }

    p.checkGold = function(buffId){
        var buff = DataMgr.getInstance().getBuffData(buffId);
        if(buff == null) return false;

        if(GameData.getInstance().goods.gold < buff.costGold){
            UIMgr.getInstance().showTips("金币不足无法激活");
            return false;
        }

        return true;
    }

    p.onPlayerGoodsUpdate = function(){
        var goods = GameData.getInstance().goods;
        this.goldTxt.text = ""+goods.gold;

        this.refreshGrowPropInfo();
    }

    p.refreshSkinChip = function(){
        this.reviveStoneTxt.text = ""+GameData.getInstance().user.skinChip;
    }

    p.onbuyStoneBtnClick = function(){
        UIMgr.getInstance().openUI(EUI.ShopView);
    }

    p.onShowSkinBtn = function(){
        UIMgr.getInstance().openUI(EUI.SkinShowView);
    }

    p.showSkin = function(skinId){
        if(this.m_skeleton == null){
            this.m_skeleton = ResMgr.getInstance().getSkeleton();
            this.m_skeleton.rotation = 90;
            this.SkinB.addChild(this.m_skeleton);
        }

        var skinUrl = "role1_run";
        var weaponUrl = "weapons-skins-1.png";
        if(skinId > 0){
            var cfg = DataMgr.getInstance().getSkinCfg(skinId);
            if(cfg != null){
                weaponUrl = cfg.weapon;
                skinUrl = cfg.url;
            }
        }

        this.Skinw.skin = "weapon/"+weaponUrl;
        this.m_skeleton.play(skinUrl,true,true);
    }

    p.refreshGrowPropInfo = function(){
        var user = GameData.getInstance().user;
        if(!user.isServerData) return;

        this.m_growBuffCost = {};
        this.m_growArrow = this.m_growArrow || {};
        var goods = GameData.getInstance().goods;
        for(var i=0; i<3; i++) {
            var btn = this.downBtn.getChildByName("buff"+i);
            if(btn == null) continue;
            var id = i + 1;
            var cfg = user.getGrowCfg(id,true);
            var addValLbl = btn.getChildByName("addVal");
            var costBox = btn.getChildByName("costBox");
            var topLvLbl = btn.getChildByName("topLv");
            var ani = this.m_growArrow[i];
            if(cfg!=null) {
                this.m_growBuffCost[id] = cfg.cost;
                var costLbl = costBox.getChildByName("cost");
                costLbl.text = cfg.cost+"";
                addValLbl.text = "+"+cfg.buffval+"%";
                costBox.visible = true;
                topLvLbl.visible = false;
                if(goods.gold >= cfg.cost) {
                    if(ani == null) {
                        ani = new Laya.Animation();
                        ani.pos(70,100);
                        ani.loadAnimation("ani/txjiantou.ani",Laya.Handler.create(this,function(obj){
                            obj.play(0,true);
                        },[ani]));  
                        btn.addChild(ani);
                        this.m_growArrow[i] = ani;
                    }
                    ani.visible = true;
                }
                else {
                    if(ani!=null)
                        ani.visible = false;
                }
            }
            else {
                this.m_growBuffCost[id] = -1;
                cfg = user.getGrowCfg(id,false);
                addValLbl.text = "+"+cfg.buffval+"%";
                costBox.visible = false;
                topLvLbl.visible = true;
                if(ani!=null)
                    ani.visible = false;
            }
        }
    }

    p.onBuffClick = function(id){
        if(this.m_growBuffCost==null) return;
        var cost = this.m_growBuffCost[id];
        if(cost == -1) {
            UIMgr.getInstance().showTips("已经最高级");
            return;
        }
        var goods = GameData.getInstance().goods;
        if(goods.gold < cost) {
            UIMgr.getInstance().showTips("金币不足");
            return;
        }
        ServerAgency.getInstance().rpcGrowProp(id);
    }

    p.onSettingClick = function(){
        UIMgr.getInstance().openUI(EUI.SettingView);
    }

    p.onPrepareClick = function(){
        // UIMgr.getInstance().openUI(EUI.VideoAdView,{type:VideoAdType.Prepare});
    }

    p.onOtherBtnClick = function(){
        UIMgr.getInstance().showTips("暂未开放");
    }

    p.onStrongBtnClick = function(){
        UIMgr.getInstance().openUI(EUI.AttributeView,{start:true});
    }

    p.clearTexture = function(){
        if(this.rankTexture!=null){
            this.friendRankSp.graphics.clear();
            this.rankTexture.destroy(true);
            this.rankTexture = null;
        }
    }

    p.onShowHideDrawer = function(){
        this.m_showDrawer = true;
        AladinSDK.ShowDrawer(function(){
            CheckIPMgr.getInstance().restoreBanner();
        });
        CheckIPMgr.getInstance().hideBanner();
    }

    /**
     * 卸载界面
     */
    p.uninit = function(){
        CheckIPMgr.getInstance().hideBanner();
        
        if(this.moreNode!=null){
            AladinSDK.HideMore();
            this.linkNode.removeChild(this.moreNode);  //获取更多好玩节点
            this.moreNode = null;
        }

        if(this.m_drawerskeleton!=null){
            this.dragonbones.removeChild(this.m_drawerskeleton);
            this.m_drawerskeleton.destroy();
            this.m_drawerskeleton = null;
            this.m_showDrawer = false;
            AladinSDK.HideDrawer();
        }

        this.clearTexture();

        this.unregisterEvent();
        if(this.m_skeleton != null){
            this.m_skeleton.stop();
            this.SkinB.removeChild(this.m_skeleton);
            this.m_skeleton.destroy();
            this.m_skeleton = null;
        }

        if(this.m_startWatchTimer){
            Laya.timer.clear(this,this.refreshADCDTime);
            this.m_startWatchTimer = false;
        }

        if(this.isSuportDom())
        {
            Laya.Browser.removeElement(this.hrefDom);
            Laya.stage.off(Laya.Event.RESIZE, this, this.fitDOMElements);
        }

        if(this.clubBtn != null)
        {
            this.clubBtn.destroy();
            this.clubBtn = null;
        }
    }
    return StartView;
}(StartViewUI));