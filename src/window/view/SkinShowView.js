/*
* name;
*/
var BtnState = {
    Default : 1, 
    Activate : 2,    
    ViewVideo : 3,  
    Fragment : 4,
    Gold : 5, 
}

var SkinShowView = (function (_super) {
    function SkinShowView() {
        SkinShowView.__super.call(this);

        this.m_skeletonList = [];
        this.m_curPage = 1;
        this.m_maxPage = parseInt(Math.ceil(SkinMgr.getInstance().skinCnt() / 3));
        this.lifeTimeComs = [];
        this.m_curVideoPos = 0;
        this.m_curVideoSkinId = 0;
        this.m_nextAdskinSkeleton = null;
    }

    Laya.class(SkinShowView,'view.SkinShowView',_super);

    var p = SkinShowView.prototype;

    p.init = function(data){
        EventMgr.getInstance().on(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().on(EEvent.RefreshSkinTime,this,this.onRefreshLeftTime);
        EventMgr.getInstance().on(EEvent.SwitchCurShowSkin,this,this.onSwitchCurShowSkin);

        this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);
        this.leftArrow.on(Laya.Event.CLICK,this,this.onPrePage);
        this.rightArrow.on(Laya.Event.CLICK,this,this.onNextPage);

        this.leftArrow.visible = this.m_curPage > 1;
        this.showSkins();
        this.showNextADSkin();
    }

    p.uninit = function(){
        for(var i = 0; i < this.m_skeletonList.length;i++){
            var skeleton = this.m_skeletonList[i];
            skeleton.stop();
            skeleton.destroy();
            skeleton = null;
        }
        this.m_skeletonList = null;

        if(this.m_nextAdskinSkeleton!=null){
            this.nextAdSkinBox.removeChild(this.m_nextAdskinSkeleton);
            this.m_nextAdskinSkeleton.stop();
            this.m_nextAdskinSkeleton.destroy();
            this.m_nextAdskinSkeleton = null;
        }


        EventMgr.getInstance().off(EEvent.ShowAdCompleted,this,this.onShowAdCompleted);
        EventMgr.getInstance().off(EEvent.RefreshSkinTime,this,this.onRefreshLeftTime);
        EventMgr.getInstance().off(EEvent.SwitchCurShowSkin,this,this.onSwitchCurShowSkin);
    }

    p.onPrePage = function(){
        if(this.m_curPage == 1) return;

        this.m_curPage--;
        this.showSkins();
        this.checkPageBtn();
    }

    p.onNextPage = function(){
        if(this.m_curPage == this.m_maxPage) return;

        this.m_curPage++;
        this.showSkins();
        this.checkPageBtn();
    }

    p.checkPageBtn = function(){
        this.leftArrow.visible = this.m_curPage > 1;
        this.rightArrow.visible = this.m_curPage< this.m_maxPage;
    }

    p.showNextADSkin = function(){
        if(SkinMgr.getInstance().nextShowAdSkin==null){
            this.nextAdSkin.visible = false;
            return;
        }

        if(this.m_nextAdskinSkeleton!=null){
            this.nextAdSkinBox.removeChild(this.m_nextAdskinSkeleton);
            this.m_nextAdskinSkeleton.stop();
            this.m_nextAdskinSkeleton.destroy();
            this.m_nextAdskinSkeleton = null;
        }
        
        this.nextAdSkin.visible = true;
        this.m_nextAdskinSkeleton = ResMgr.getInstance().getSkeleton();
        this.m_nextAdskinSkeleton.rotation = 90;
        this.m_nextAdskinSkeleton.scale(0.5,0.5);
        this.m_nextAdskinSkeleton.pos(this.nextAdSkinBox.width/2,this.nextAdSkinBox.height/2-9);
        this.nextAdSkinBox.addChild(this.m_nextAdskinSkeleton);
        this.m_nextAdskinSkeleton.zOrder = -1;
        this.m_nextAdskinSkeleton.play(SkinMgr.getInstance().nextShowAdSkin.skinUrl(),true,true);
        this.nextAdSkinTips.text = "第二天免费获得"+SkinMgr.getInstance().nextShowAdSkin.getName()+"哦！";        
    }
    var datas = [];
    p.showSkins = function(){
        datas.length = 0;
        var skins = SkinMgr.getInstance().skinList;
        var skinCnt = skins.length;
        var val = (this.m_curPage-1)*3;
        for(var cursor = val; cursor < skinCnt && cursor < val+3;cursor++){
            datas.push(skins[cursor]);
        }

        for(var i = 0; i < datas.length;i++){
            var item = this.box.getChildByName("slot"+(i+1));
            if(item!=null){
                this.setSkinData(datas[i],item);
            }
        }

        for(var i = datas.length; i < 3;i++)
        {
            var item = this.box.getChildByName("slot"+(i+1));
            if(item!=null){
                item.visible = false;
            }
        }
    }

    p.setSkinData = function(skin,item){
        if(skin == null){
            item.visible = false;
            return;
        }

        item.visible = true;
        var skinBox = item.getChildByName("skinBox");
        if(skinBox!=null){
            var skinModel = skinBox.getChildByName("skin");
            if(skinModel!=null){
                var skeleton = skinModel.getChildByName("skeleton");
                if(skeleton == null){
                    skeleton = ResMgr.getInstance().getSkeleton();
                    this.m_skeletonList.push(skeleton);
                }
                skeleton.rotation = 90;
                skeleton.name = "skeleton";
                skinModel.addChild(skeleton);

                skeleton.play(skin.skinUrl(),true,true);
            }

            var weapon = skinBox.getChildByName("weapon");
            if(weapon!=null){
                weapon.skin = "weapon/"+skin.cfg.weapon;
            }
        }

        var descText = item.getChildByName("desc");
        if(descText!=null){
            descText.text = skin.getDesc();
        }

        var durationText = item.getChildByName("duration");
        if(durationText!=null){
            if(skin.cfg.duration == -1){
                durationText.text = "永久";
            }else{
                durationText.text = Math.ceil(skin.cfg.duration/86400) + "天";
            }
        }
        durationText.visible = !skin.owned;
        var durationBg = item.getChildByName("durationBg");
        if(durationBg!=null){
            durationBg.visible = !skin.owned;
        }

        var openPath = item.getChildByName("openPath");
        var leftTime = item.getChildByName("leftTime");
        var usingImg = item.getChildByName("usingImg");
        var btn = item.getChildByName("btn");
        var adBox = item.getChildByName("adBox");

        usingImg.visible = false;
        btn.visible = false;
        leftTime.visible = false;
        openPath.visible = false;
        adBox.visible = false;
        if(this.lifeTimeComs.length < 3){
            this.lifeTimeComs.push(leftTime);
        }

        if(skin.owned){
            if(skin.id == SkinMgr.getInstance().usingSkinId()){
                usingImg.visible = true;
            }else{
                btn.visible = true;
                this.refreshBtnStatus(btn,BtnState.Activate,skin);
            }
            leftTime.visible = !skin.isPersistent();
            leftTime.text = StringUtil.getFormatSeconds(skin.leftTime);
        }else{
            if(SkinMgr.getInstance().isShowingSkin(skin.id)){
                if(skin.isFragmentSkin()){
                    btn.visible = true;
                    this.refreshBtnStatus(btn,BtnState.Fragment,skin);
                    btn.label = skin.getPrice();
                    this.checkCost(skin.getPrice(),2,btn);
                }else if(skin.isGoldSkin()){
                     btn.visible = true;
                     this.refreshBtnStatus(btn,BtnState.Gold,skin);
                     btn.label = skin.getPrice();
                     this.checkCost(skin.getPrice(),1,btn);
                }else if(skin.isAdSkin()){
                     btn.visible = true;
                     adBox.visible = true;
                     this.setAdList(adBox,skin);
                     this.refreshBtnStatus(btn,BtnState.ViewVideo,skin);
                }
            }else{
                 if(skin.isFragmentSkin()){
                     btn.visible = true;
                     this.refreshBtnStatus(btn,BtnState.Fragment,skin);
                     btn.label = skin.getPrice();
                     this.checkCost(skin.getPrice(),2,btn);
                 }else if(skin.isGoldSkin() || skin.isAdSkin()){
                     openPath.visible = true;
                     //openPath.text = "第"+skin.openDay+"天开放";
                     openPath.text = "敬请期待";
                 }else{
                     openPath.visible = true;
                     openPath.text = skin.getFrom();
                 }
            }
        }
    }

    p.checkCost = function(price,type,btn,tips){
        var money = 0;
        if(type == 1){    //金币
            money = GameData.getInstance().goods.gold;
        }else if(type == 2){    //碎片
            money = GameData.getInstance().user.skinChip;
        }

        var ok = price <= money;

        if(btn!=null){
            if(ok){
                btn.labelColors = "#000000";
            }else{
                btn.labelColors = "#ff0000";
            }
        }
        if(tips && !ok){
            if(type == 1){
                UIMgr.getInstance().showTips("金币不足",2000);
            }else if(type == 2){
                UIMgr.getInstance().showTips("碎片不足",2000);
            }
        }
        return ok;
    }

    p.setAdList = function(adBox,skin){
        if(skin == null) return;

        var adList = adBox.getChildByName("adList");
        var ad_arr = [];
        for(var i = 0; i < skin.maxAdCnt();i++){
            var obj = {bg:{visible:true},ad:{visible:i < skin.showedAdCnt}};
            ad_arr.push(obj);
        }

        adList.width = 39 * ad_arr.length;
        adList.array = ad_arr;
    }

    p.refreshBtnStatus = function(btn,btnState,skin){
        if(btn == null) return;

        btn.off(Laya.Event.CLICK,this,this.onClickBtn);
        btn.on(Laya.Event.CLICK,this,this.onClickBtn,[skin.id,btnState]);

        var btnUrl = "";
        if(btnState == BtnState.Activate){
            btnUrl = "SkinShow/Button_Bg.png";
        }else if(btnState == BtnState.ViewVideo){
            btnUrl = "SkinShow/Adshow.png";
        }else if(btnState == BtnState.Fragment){
            btnUrl = "SkinShow/chipbuy.png";
        }else if(btnState == BtnState.Gold){
            btnUrl = "SkinShow/coinbuy.png";
        }
        btn.skin = btnUrl;
        btn.label = this.getBtnLabel(btnState);
        btn.labelColors = "#ffffff";
    }

    p.onClickBtn = function(skinId,btnState){
        console.log("skinId:"+skinId+" btnState:"+btnState);
        if(btnState == BtnState.Fragment){
            //碎片获取
            this.buySkin(skinId,2);
        }else if(btnState == BtnState.ViewVideo){
            //视频获取
            var skin = SkinMgr.getInstance().getSkinById(skinId);
            this.m_curVideoPos = skin.getSkinVideoPos();
            this.m_curVideoSkinId = skinId;
            CheckIPMgr.getInstance().showVideoOrShare(skin.getSkinVideoPos());
        }else if(btnState == BtnState.Gold){
            //金币购买
            this.buySkin(skinId,1);
        }else if(btnState == BtnState.Activate){
            //使用皮肤
            SkinMgr.getInstance().switchSkin(skinId);
            this.showSkins();
        }
    }

    p.buySkin = function(skinId,type){
        var skin = SkinMgr.getInstance().getSkinById(skinId);

        if(this.checkCost(skin.getPrice(),type,null,true)){    
            if(type == 1){
                var gold = GameData.getInstance().goods.gold;
                gold -= skin.getPrice();
                ServerAgency.getInstance().onUpdateGoods({'gold':gold});
                ServerAgency.getInstance().rpcCostGold(skin.getPrice());
            }else if(type == 2){       
                GameData.getInstance().user.subSkinChip(skin.getPrice());
            }
            skin.activated();
            this.showSkins();
        }
    }

    p.getBtnLabel = function(state){
        switch(state){
            case BtnState.Default:
                return "默认";
            case BtnState.Activate:
                return "使用";
            case BtnState.ViewVideo:
                return "";
            case BtnState.Fragment:
                return "";
            case BtnState.Gold:
                return "";
            default:
                return "";
        }
    }

    p.onSwitchCurShowSkin = function(){
        this.showSkins();
        this.showNextADSkin();
    }

    p.onRefreshLeftTime = function(){
        for(var i = 0; i < datas.length;i++){
            var skin = datas[i];
            if(skin.owned){
                this.lifeTimeComs[i].text = StringUtil.getFormatSeconds(skin.leftTime);
            }
        }
    }

    p.onShowAdCompleted = function(pos){
        if(pos == this.m_curVideoPos){
            SkinMgr.getInstance().addAdCnt(this.m_curVideoSkinId);
            this.showSkins();
        }
    }

    p.onClose = function(){
        UIMgr.getInstance().closeUI(EUI.SkinShowView);
    }

    return SkinShowView;
})(SkinShowViewUI)