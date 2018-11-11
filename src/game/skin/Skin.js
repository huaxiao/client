/*
* name;
*/
var Skin = (function () {
    var Skin = Class();
    var p = Skin.prototype;

    p.ctor = function(cfg){
        this.id = cfg.id;
        this.cfg = cfg;

        this.owned = false;
        this.activatedTime = 0;
        this.leftTime = 0;
        this.openDay = 0;
        this.showedAdCnt = 0;
    }

    p.activated = function(){
        this.owned = true;
        this.activatedTime = Date.now();
        this.leftTime = this.cfg.duration;

        SDKMgr.getInst().report(ReportType.Get_Skin,{'extends':this.id});
        EventMgr.getInstance().event(EEvent.ActivatedSkin,this.id);
    }

    p.setData = function(owned,showedAdCnt,activatedTime,leftTime){
        this.owned = owned;
        if(showedAdCnt == null){
            this.showedAdCnt = 0;
        }else{
             this.showedAdCnt = showedAdCnt;
        }
        this.activatedTime = activatedTime;
        this.leftTime = leftTime;
    }

    p.maxAdCnt = function(){
        return this.cfg.adCnt;
    }

    p.addAdCnt = function(){
        this.showedAdCnt++;
        if(this.showedAdCnt>= this.maxAdCnt()){
            this.activated();
        }else{
            EventMgr.getInstance().event(EEvent.RefreshSkinAdCnt,this.id);
        }
    }

    p.getDesc = function(){
        if(this.isDefault()){
            return "";
        }

        return "提升"+this.getBuffVal()+"%"+Utils.getBuffDesc(this.getBuffType());
    }

    p.getBuffType = function(){
        return this.cfg.attributetype;
    }

    p.getBuffVal = function(){
        return this.cfg.attributevalue;
    }

    p.isFragmentSkin = function(){
        return this.cfg.type == SkinType.Fragment;
    }

    p.isAdSkin = function(){
        return this.cfg.type == SkinType.AD;
    }

    p.isGoldSkin = function(){
        return this.cfg.type == SkinType.Gold;
    }

    p.isDefault = function(){
        return this.cfg.type == SkinType.Default;
    }

    p.getPrice = function(){
        return this.cfg.price;
    }

    p.getFrom = function(){
        return this.cfg.from;
    }
    
    p.getType = function(){
        return this.cfg.type;
    }

    p.isPersistent = function(){
        return this.cfg.duration == -1;
    }

    p.getShowDuration = function(){
        return this.cfg.showDuration;
    }

    p.getSkinVideoPos = function(){
        return this.cfg.adPos;
    }

    p.skinUrl = function(){
        return this.cfg.url;
    }

    p.getName = function(){
        return this.cfg.name;
    }

    p.weaponUrl = function(){
        return this.cfg.weapon;
    }

    return Skin;
}());