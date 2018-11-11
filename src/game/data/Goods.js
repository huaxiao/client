/*
* 道具
*/
var Goods = (function () {
    function Goods() {
        this.uid = 0;
        this.gold = 0;  //金币
        this.reviveStone = 0;   //复活石
        this.lastGoldTime = 0;  //上次领取金币时间
        this.dailyShareCnt = 0; //每日分享次数
        this.dailyPrize = 0; //每日奖励

    }

    var p = Goods.prototype;

    p.setUid = function(uid){
        this.uid = uid;
    }

    p.loadCacheData = function(){
        var obj = Laya.LocalStorage.getJSON("goods_"+this.uid);
        if(obj == null||obj=="") return false;

        for(var key in obj) {
            this[key] = obj[key];
        }

        EventMgr.getInstance().event(EEvent.RefreshAdCDTime);
        EventMgr.getInstance().event(EEvent.Player_Goods_Update);
        return true;
    }

    p.updateWidthData = function(data){
        var notifyGoldTime = false;
        for(var key in data) {
            this[key] = data[key];

            if(key == "lastGoldTime") notifyGoldTime = true;
        }

        if(notifyGoldTime)
            EventMgr.getInstance().event(EEvent.RefreshAdCDTime);

        this.saveToStorage();
    }

    p.updateWidthChangeData = function(data){
        var notifyGoldTime = false;
        for(var key in data) {
            this[key] += data[key];

            if(key == "lastGoldTime") notifyGoldTime = true;
        }

        if(notifyGoldTime)
            EventMgr.getInstance().event(EEvent.RefreshAdCDTime);

        EventMgr.getInstance().event(EEvent.Player_Goods_Update);
        this.saveToStorage();
    }

    p.saveToStorage = function(){
        Laya.LocalStorage.setJSON("goods_"+this.uid,this);
    }

    return Goods;
}());