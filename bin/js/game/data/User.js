/*
* 用户
*/
var User = (function () {
    function User() {
        this.uid = 0;
        this.uname = "";
        this.lv = 1;    //等级    
        this.star = 0;  //星星
        this.highScore = 0;//历史最高分
        this.createTime = 0;//
        this.grow = {};//成长属性

        this.token = null;
        this.session_key = null;
        this.openid = "";
        this.city = null;//城市

        this.serverUname = "";
        this.grade = 0;//段位
        this.isServerData = false;
        this.olderPlayer = false;   //是否老用户
        this.skinChip = 0;

        this.isUseStorageData = false;

        //miniServer
        this.lastBattleGold = 0;
        this.lastBattleEndTime = 0;

    }

    var p = User.prototype;

    p.setUid = function(uid){
        this.uid = uid;
    }

    p.loadCacheData = function(){
        var obj = Laya.LocalStorage.getJSON("user_"+this.uid);
        if(obj == null||obj=="") return false;

        for(var key in obj) {
            this[key] = obj[key];
        }
        this.setStar(this.star,true);

        EventMgr.getInstance().event(EEvent.Player_SkinChip_Update);

        return true;
    }

    p.setSkinChip = function(val){
        this.skinChip = val;
        EventMgr.getInstance().event(EEvent.Player_SkinChip_Update);
        this.saveToStorage();
    }

    p.addSkinChip = function(addVal){
        var newVal = this.skinChip + addVal;
        this.setSkinChip(newVal);
    }

    p.subSkinChip = function(val){
        var newVal = this.skinChip - val;
        this.setSkinChip(newVal);
    }

    p.setServerData = function(val){
        this.isServerData = val;
        if(val)
            this.saveToStorage();
    }

    p.saveToStorage = function(){
        Laya.LocalStorage.setJSON("user_"+this.uid,this);
    }

    p.setLv = function(lv) {
        this.lv = lv;
    }

    p.resetStar = function(){
        this.setStar(this.star);
    }

    p.setStar = function(star,notEvent) {
        this.star = star;
        if(DataMgr.getInstance().getMaxUserGrade() == null) return;
        var data = DataMgr.getInstance().getGradeDataByStar(star);
        this.grade = data.grade;
        this.gradeStar = data.gradeStar;
        // Laya.LocalStorage.setItem("user_star",star);

        if(!notEvent)
            EventMgr.getInstance().event(EEvent.Player_Star_Update);
    }

    //获取当前段位星星数
    p.getGradeStar = function() {
        return this.gradeStar;
    }

    p.setUname = function(name,isServer){
        if(isServer) {
            this.serverUname = name;
        }
        else {
            this.uname = name;
            if(typeof(TalkingData) != "undefined")
                TalkingData.GetUserInfo(this.openid,this.name);
        }
        if(this.serverUname != "" && this.uname != "" && this.serverUname != this.uname)
            ServerAgency.getInstance().sendName(this.uname);
    }

    p.setGrow = function(data){
        for(var k in data) {
            this.grow[k] = data[k];
        }
        EventMgr.getInstance().event(EEvent.Player_Grow_Update);
    }

    p.AddGowLv = function(id){
        this.grow[id] = this.grow[id] || 0;
        this.grow[id] += 1;
        EventMgr.getInstance().event(EEvent.Player_Grow_Update);
        this.saveToStorage();
    }

    p.getGrowCfg = function(id,isNextLv){
        var lv = this.grow[id] || 0;
        if(isNextLv)
            lv += 1;
        var cfg = DataMgr.getInstance().getGrowPropCfg(id,lv);
        return cfg;
    }

    p.getGrowLv = function(id){
        return this.grow[id]||0;
    }

    return User;
}());