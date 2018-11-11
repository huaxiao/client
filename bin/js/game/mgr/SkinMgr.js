var SkinType = {
    Fragment : 1, 
    AD : 2,    
    Gold : 3,  
    Other : 4,
    Default : 5,
}

/*
* 皮肤管理器
*/
var SkinMgr = (function () {
    function SkinMgr() {
        this.m_usingSkinId = 0;   //当前使用皮肤ID
        this.m_curSkin = null;

        this.m_cacheSkinData = {};
        this.skinList = []; //皮肤列表
        this.showSkinData = {'fragmentSkinId':0,'fragmentSwitchTime':0,'fragmentLeftDay':0,'adSkinId':0,'adSwitchTime':0,'adLeftDay':0,'nextAdSkinId':0,'goldSkinId':0,'goldSwitchTime':0,'goldLeftDay':0};
        this.m_showedSkinList = {}; //展示过的皮肤列表
        this.nextShowAdSkin =  null;
        this.defaultSkin = null;
        this.fragmentSkinCnt = 0;
        this.adSkinCnt = 0;
        this.goldSkinCnt = 0;
        this.regisiterEvent();
        this.init();
    }

    SkinMgr.getInstance = function(){
        if(SkinMgr._instance == null){
            SkinMgr._instance = new SkinMgr();
        }
        return SkinMgr._instance;
    }
    
    var p = SkinMgr.prototype;

    p.regisiterEvent = function(){
        EventMgr.getInstance().on(EEvent.ActivatedSkin,this,this.onActivateSkin);
        EventMgr.getInstance().on(EEvent.RefreshSkinAdCnt,this,this.onRefreshAdCnt);
        
        Laya.timer.loop(1000,this,this.checkSkinLeftTimeTimer);
        Laya.timer.loop(3600000,this,this.checkCurShowSkinTimer);
    }

    p.init = function(){
        this.initData();
        this.readSkinCache();
        this.initSkinList();
        this.checkCurShowSkinTimer();
    }

    p.initData = function(){
        this.skinList.length = 0;
        var skinCfgData = DataMgr.getInstance().skinCfgData;
        if(skinCfgData!=null){
            for(var i = 0; i < skinCfgData.length;i++){
                var cfg = skinCfgData[i];
                var skin = new Skin(cfg);
                this.skinList.push(skin);
                if(skin.getType() == SkinType.Default){
                    this.defaultSkin = skin;
                    skin.setData(true,0,0,0);
                }
            }
        }
    }

    p.readSkinCache = function(){
        var temp = Laya.LocalStorage.getJSON("skinCacheData");
        for(var id in temp){
            var skin = this.getSkinById(id);
            if(skin == null) continue;

            var skinInfo = temp[id];
            var owned = skinInfo.owned;
            var showedAdCnt = skinInfo.adCnt;
            var activatedTime  = skinInfo.activatedTime;
            var leftTime = 0;
            if(activatedTime > 0){
                var passedTime = parseInt((Date.now() - activatedTime)/1000);
                if(!skin.isPersistent()){
                    leftTime = skin.cfg.duration -  passedTime;
                    if(leftTime <= 0){
                        leftTime = 0;
                        owned = false;
                        adCnt = 0;
                    }
                }
            }
            skin.setData(owned,showedAdCnt,activatedTime,leftTime);
            this.m_cacheSkinData[id] = {'owned':skin.owned,'adCnt':skin.showedAdCnt,'activatedTime':skin.activatedTime};
        }

        temp = Laya.LocalStorage.getJSON("showedSkinList");
        for(var i in temp){
            var date = temp[i];
            this.m_showedSkinList[i] = new Date(date);
        }
        // console.log("showedSkinList:"+JSON.stringify(this.m_showedSkinList));


        temp = Laya.LocalStorage.getJSON("showSkinData");
        if(temp == null || temp.fragmentSkinId == null){
            var d = new Date();
            this.showSkinData.fragmentSkinId = this.getShowSkinId(SkinType.Fragment);
            this.showSkinData.adSkinId = this.getShowSkinId(SkinType.AD);
            this.showSkinData.goldSkinId = this.getShowSkinId(SkinType.Gold);
            this.showSkinData.fragmentSwitchTime = d;
            this.showSkinData.adSwitchTime = d;
            this.showSkinData.goldSwitchTime = d;

            var skin = this.getSkinById(this.showSkinData.adSkinId);
            this.showSkinData.adLeftDay = skin.getShowDuration();

            skin = this.getSkinById(this.showSkinData.goldSkinId);
            this.showSkinData.goldLeftDay = skin.getShowDuration();

            this.m_showedSkinList[this.showSkinData.fragmentSkinId] = d;
            this.m_showedSkinList[this.showSkinData.adSkinId] = d;
            this.m_showedSkinList[this.showSkinData.goldSkinId] = d;

            this.saveShowSkinData();
        }else{
            if(GameConst.FragmentSkinId >0 && !this.hasOwnSkin(GameConst.FragmentSkinId)){
                this.showSkinData.fragmentSkinId = GameConst.FragmentSkinId;
            }else{
                this.showSkinData.fragmentSkinId = temp.fragmentSkinId;
            }
            
            this.showSkinData.adSkinId = temp.adSkinId;
            this.showSkinData.goldSkinId = temp.goldSkinId;
            this.showSkinData.nextAdSkinId = temp.nextAdSkinId;
            if(this.showSkinData.nextAdSkinId!=null && this.showSkinData.nextAdSkinId>0){
                this.nextShowAdSkin = this.getSkinById(this.showSkinData.nextAdSkinId);
            }

            this.showSkinData.fragmentSwitchTime = new Date(temp.fragmentSwitchTime);
            this.showSkinData.adSwitchTime = new Date(temp.adSwitchTime);
            this.showSkinData.goldSwitchTime = new Date(temp.goldSwitchTime);
            var dt = new Date();

            var skin = this.getSkinById(this.showSkinData.adSkinId);
            if(skin!=null){
                var leftD = this.getLeftShowDay(skin,dt,this.showSkinData.adSwitchTime);
                this.showSkinData.adLeftDay = leftD;
            }

            skin = this.getSkinById(this.showSkinData.goldSkinId);
            if(skin != null){
                 leftD = this.getLeftShowDay(skin,dt,this.showSkinData.goldSwitchTime);
                this.showSkinData.goldLeftDay = leftD;
            }

            this.m_showedSkinList[this.showSkinData.fragmentSkinId] = dt;
            this.m_showedSkinList[this.showSkinData.adSkinId] = dt;
            this.m_showedSkinList[this.showSkinData.goldSkinId] = dt;
        }
        // console.log("showSkinData:"+JSON.stringify(this.showSkinData));


        temp = Laya.LocalStorage.getItem("skin_usingSkinId");
        if(temp == null){
            this.m_usingSkinId = this.defaultSkin.id;
        }else {
            this.m_usingSkinId= parseInt(temp) || this.defaultSkin.id;
        }

        if(!this.hasOwnSkin(this.m_usingSkinId)){
            this.m_usingSkinId = this.defaultSkin.id;
        }
        this.m_curSkin = this.getSkinById(this.m_usingSkinId);
    }

    var unOwnedSkin = [];
    var ownedSkin = [];
    var showingSkin = [];
    p.initSkinList = function(){
        this.sort();

        var adDay = this.showSkinData.adLeftDay;
        var goldDay = this.showSkinData.goldLeftDay;

        this.fragmentSkinCnt = 0;
        this.adSkinCnt = 0;
        this.goldSkinCnt = 0;

        for(var i = 0; i < this.skinList.length;i++){
            var skin = this.skinList[i];

            if(skin.isAdSkin()){
                skin.openDay = adDay;
                adDay += skin.cfg.showDuration;
                this.adSkinCnt++;
            }else if(skin.isGoldSkin()){
                skin.openDay = goldDay;
                goldDay += skin.cfg.showDuration;
                this.goldSkinCnt++;
            }else if(skin.isFragmentSkin()){
                this.fragmentSkinCnt++;
            }
        }
    }

    p.sort = function(){
       unOwnedSkin.length = 0;
       ownedSkin.length = 0;
       showingSkin.length = 0;
       for(var i = 0; i < this.skinList.length;i++){
           var skin = this.skinList[i];
           if(this.isShowingSkin(skin.id)){
                showingSkin.push(skin);
           }else{
                if(skin.owned){
                    ownedSkin.push(skin);
                }else{
                    unOwnedSkin.push(skin);
                }
           }
       }

       showingSkin.sort(function(a,b){
           return a.getType() - b.getType();
       });

       unOwnedSkin.sort(function(a,b){
           if(a.getType() == b.getType()){
               return a.id - b.id;
           }else{
               return a.getType() - b.getType();
           }
       });

       ownedSkin.sort(function(a,b){
           if(a.isDefault() && !b.isDefault()){
               return 1;
           }else if(!a.isDefault() && b.isDefault()){
               return -1;
           }else{
                if(!a.isPersistent() && b.isPersistent()){
                    return 1;
                }else if(a.isPersistent() && !b.isPersistent()){
                    return -1;
                }else{
                    return a.id - b.id;
                }
           }
       });

       this.skinList.length = 0;
       for(var i = 0; i < showingSkin.length;i++){
           this.skinList.push(showingSkin[i]);
       }

       for(var i = 0; i < unOwnedSkin.length;i++){
           this.skinList.push(unOwnedSkin[i]);
       }

       for(var i = 0; i < ownedSkin.length;i++){
           this.skinList.push(ownedSkin[i]);
       }
       
       unOwnedSkin.length = 0;
       ownedSkin.length = 0;
       showingSkin.length = 0;
    }
    
    p.isShowingSkin = function(id){
        return id == this.showSkinData.fragmentSkinId || id == this.showSkinData.adSkinId || id == this.showSkinData.goldSkinId;
    }

    p.skinCnt = function(){
        return this.skinList.length;
    }

    p.getSkinList = function(){
        return this.skinList;
    }

    p.getSkinById = function(id){
        for(var i = 0; i < this.skinList.length;i++){
            if(this.skinList[i].id == id) return this.skinList[i];
        }

        return null;
    }

    p.addAdCnt = function(skinId){
        var skin = this.getSkinById(skinId);
        if(skin == null) return;

        skin.addAdCnt();
    } 

    p.onActivateSkin = function(skinId){
        this.m_curSkin = this.getSkinById(skinId);
        if(this.m_curSkin!=null){
            this.m_usingSkinId = skinId;
            EventMgr.getInstance().event(EEvent.SwitchSkin,skinId);
            this.saveSkinData(skinId);
        }

        if(skinId == this.showSkinData.fragmentSkinId){
            this.switchCurShowSkin(SkinType.Fragment);
            this.initSkinList();
        }else{
            this.initSkinList();
        }
    }

    p.onRefreshAdCnt = function(skinId){
         var skin = this.getSkinById(skinId);
         if(skin!=null){
              this.saveSkinData(skinId);
         }
    }

    p.switchSkin = function(skinId){
        this.m_usingSkinId = skinId;
        this.saveSkinData();
        EventMgr.getInstance().event(EEvent.SwitchSkin,skinId);
    }

    p.saveSkinData = function(skinId,owned,time,adCnt){   
        Laya.LocalStorage.setItem("skin_usingSkinId", this.m_usingSkinId);
        
        if(skinId!=null){
            var skin = this.getSkinById(skinId);
            if(skin !=null){
                this.m_cacheSkinData[skinId] = {'owned':skin.owned,'adCnt':skin.showedAdCnt,'activatedTime':skin.activatedTime};
                Laya.LocalStorage.setJSON("skinCacheData",this.m_cacheSkinData);
            }
        }
    }

    p.saveShowSkinData = function(){    
        Laya.LocalStorage.setJSON("showSkinData",this.showSkinData);
        Laya.LocalStorage.setJSON("showedSkinList",this.m_showedSkinList);
    }
    
    var tempArr = [];
    var tempArr2 = [];
    p.getShowSkinId = function(type){
        if(type == SkinType.Fragment && GameConst.FragmentSkinId > 0 && !this.hasOwnSkin(GameConst.FragmentSkinId)){
            return GameConst.FragmentSkinId;
        }

        var existType = false;
        var existUnowned = false;
        tempArr.length = 0;
        tempArr2.length = 0;
        for(var i = 0; i < this.skinList.length; i++){
            var skin = this.skinList[i];
            if(skin.getType() == type){
                existType = true;
                if(!skin.owned){
                    existUnowned = true;
                    if(!this.hasSkinShowed(skin.id) && !this.isShowingSkin(skin.id)){
                        tempArr.push(skin);
                    }
                    else{
                        if(type == SkinType.AD)
                            tempArr2.push(skin);
                    }
                }
            }
        }

        if(tempArr.length > 0){
            if(type == SkinType.AD){
                tempArr2.sort(function(a,b){
                    return a.id - b.id;
                });

                if(tempArr.length>1)
                    this.showSkinData.nextAdSkinId = tempArr[1].id;
                else if(tempArr2.length > 0)
                    this.showSkinData.nextAdSkinId = tempArr2[0].id;
                else
                    this.showSkinData.nextAdSkinId = 0;
                
                if(this.showSkinData.nextAdSkinId>0){
                    this.nextShowAdSkin = this.getSkinById(this.showSkinData.nextAdSkinId);
                }else{
                    this.nextShowAdSkin = null;
                }
            }
            return tempArr[0].id;
        }else{
            if(existType && existUnowned){
                this.clearShowedSkinData(type);
                return this.getShowSkinId(type);
            }
        }
        return 0;
    }

    p.CurShowSkinId = function(type){
        if(type==SkinType.Fragment){
            return this.showSkinData.fragmentSkinId;
        }else if(type == SkinType.AD){
            return this.showSkinData.adSkinId;
        }else if(type == SkinType.Gold){
            return this.showSkinData.goldSkinId;
        }
        return 0;
    }

    p.resetActivatedSkin = function(){
        this.m_usingSkinId = 0;   //当前使用皮肤ID
        this.m_curSkin = null;

        this.saveSkinData();
        EventMgr.getInstance().event(EEvent.SwitchSkin,0);
    }

    p.hasOwnSkin = function(skinId){
        var skin = this.getSkinById(skinId)
        if(skin!=null){
            return skin.owned;
        }
        return false;
    }
    
    p.hasSkinShowed = function(skinId){
        var showedSkin = this.m_showedSkinList[skinId];
        if(showedSkin != null) return true;

        return false;
    }

    p.hasUnOwnedSkin = function(){
        for(var i = 0; i < this.skinList.length;i++){
            if(!this.skinList[i].owned) return true;
        }

        return false;
    }
    
    p.usingSkinId = function(){
        return this.m_usingSkinId;
    }

    p.wearedSkin = function(){
        return this.m_usingSkinId > 0 && this.m_usingSkinId != this.defaultSkin.id;
    }

    p.checkSkinLeftTimeTimer = function(){
        var update = false;
        for(var i =0; i < this.skinList.length;i++){
            var skin = this.skinList[i];
            if(skin.owned && !skin.isPersistent()){
                update = true;
                skin.leftTime--;
                if(skin.leftTime == 0){
                    skin.setData(false,0,0,0);
                    if(skin.id == this.m_usingSkinId){
                        this.resetActivatedSkin();
                    }
                }
            }
        }
        if(update)
            EventMgr.getInstance().event(EEvent.RefreshSkinTime);
    }

    p.checkCurShowSkinTimer = function(){
        this.checkFragmentSkinTimer();
        this.checkAdSkinTimer();
        this.checkGoldSkinTimer();
    }

    p.checkFragmentSkinTimer = function(){
        if(this.showSkinData.fragmentSkinId > 0 && this.fragmentSkinCnt > 1 && GameConst.FragmentSkinId!=this.showSkinData.fragmentSkinId){
            var dt = new Date();
            var switched = this.checkDate(this.showSkinData.fragmentSkinId,this.showSkinData.fragmentSwitchTime,SkinType.Fragment,dt);
            if(switched){
                this.initSkinList();
                EventMgr.getInstance().event(EEvent.SwitchCurShowSkin);
            }
        }
    }

    p.checkAdSkinTimer = function(){
        if(this.showSkinData.adSkinId > 0 && this.adSkinCnt > 1){
             var dt = new Date();
             var switched = this.checkDate(this.showSkinData.adSkinId,this.showSkinData.adSwitchTime,SkinType.AD,dt);
             if(switched){
                this.initSkinList();
                EventMgr.getInstance().event(EEvent.SwitchCurShowSkin);
             }
        }
    }

    p.checkGoldSkinTimer = function(){
        if(this.showSkinData.goldSkinId > 0 && this.goldSkinCnt > 1){
            var dt = new Date();
            var switched = this.checkDate(this.showSkinData.goldSkinId,this.showSkinData.goldSwitchTime,SkinType.Gold,dt);
            if(switched){
                this.initSkinList();
                EventMgr.getInstance().event(EEvent.SwitchCurShowSkin);
            }
        }
    }

    p.checkDate = function(skinId,time,type,dt){
        var y = dt.getFullYear();
        var m = dt.getMonth();
        var d = dt.getDate();

        var dt1 = new Date(time);
        var y1 = dt1.getFullYear();
        var m1 = dt1.getMonth();
        var d1 = dt1.getDate();

        var needSwitch = false;
        var skinCfg = DataMgr.getInstance().getSkinCfg(skinId);

        if((y > y1) ||((y == y1) &&((m > m1) || (m == m1 && d > d1))))
        {
            if(y > y1 || m > m1){
                needSwitch = true;
            }else{
                var deltaD = d - d1;
                if(deltaD  >= skinCfg.showDuration){
                    needSwitch = true;
                }
            }
        }

        if(needSwitch){
            this.switchCurShowSkin(type,dt);
        }

        return needSwitch;
    }

    p.getLeftShowDay = function(skin,dt,activatedDT){
        var y = dt.getFullYear();
        var m = dt.getMonth();
        var d = dt.getDate();

        var y1 = activatedDT.getFullYear();
        var m1 = activatedDT.getMonth();
        var d1 = activatedDT.getDate();

        if((y = y1) ||((y == y1) &&((m > m1) || (m == m1 && d > d1))))
        {
            if(y > y1 || m > m1){
                return 0;
            }else{
                var deltaD = d - d1;
                if(skin.getShowDuration()  >= deltaD){
                    return skin.getShowDuration() - deltaD;
                }
            }
        }
        return 0;
    }

    p.switchCurShowSkin = function(type,dt){
        var d = dt;
        if(d == null)
            d = new Date();

        if(type == SkinType.Fragment){
            this.showSkinData.fragmentSkinId = this.getShowSkinId(SkinType.Fragment);
            this.showSkinData.fragmentSwitchTime = d;
            this.m_showedSkinList[this.showSkinData.fragmentSkinId] = d;
        }else if(type == SkinType.AD){
            this.showSkinData.adSkinId = this.getShowSkinId(SkinType.AD);
            this.showSkinData.adSwitchTime = d;
            this.m_showedSkinList[this.showSkinData.adSkinId] = d;
            var skin = this.getSkinById(this.showSkinData.adSkinId);
            this.showSkinData.adLeftDay = skin.getShowDuration();
        }else if(type == SkinType.Gold){
            this.showSkinData.goldSkinId = this.getShowSkinId(SkinType.Gold);
            this.showSkinData.goldSwitchTime = d;
            this.m_showedSkinList[this.showSkinData.goldSkinId] = d;
            var skin = this.getSkinById(this.showSkinData.goldSkinId);
            this.showSkinData.goldLeftDay = skin.getShowDuration();
        }
        this.saveShowSkinData();   
    }

    p.clearShowedSkinData = function(type){
        for(var i = 0; i < this.skinList.length;i++){
            if(this.skinList[i].getType() == type)
                delete this.m_showedSkinList[this.skinList[i].id];
        }
    }

    return SkinMgr;
}());

SkinMgr._instance = null;