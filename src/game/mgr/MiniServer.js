
var WatchAdType = {
    Lobby : 1,
    BattleEnd : 2
}
    
var MiniServer = (function () {
    function MiniServer() {
    }

    /**
     * 单例
     */
    MiniServer.getInstance = function(){
        if(MiniServer._instance == null){
            MiniServer._instance = new MiniServer();
            MiniServer._instance.init();
        }
        return MiniServer._instance;
    }

    var p = MiniServer.prototype;

    p.init = function() {
        this.WatchVideaGetGold = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.WatchVideaGetGold) || 10;
        this.VideaCDTime = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.VideaCDTime) * 1000;
        this.FightTimeMS = 1000*(DataMgr.getInstance().getGlobalCfg(EGlobalCfg.BattleEndMinInterval) || 30);
        this.DailyPrizeReviveStone = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.DailyPrizeReviveStone) || 2;
        this.ScoreGoldRatio = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldRatio) || 0.001;
        this.ScoreGoldMin = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldMin) || 1;
        this.ScoreGoldMax = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.ScoreGoldMax) || 20;
    }

    p.uninit = function() {
    }

    p.handleMessage = function(reqId,route,msg){
        var name = route.substring(route.lastIndexOf(".")+1);
        var func = this[name];
        if(func!=null) {
            var retData = func.apply(this,[msg]);
            NetMgr.getInstance().miniServerCallback(reqId,retData);
        }
    }

    p.watchAdToGetGold = function(msg){
        var type = msg.type;
        var user = GameData.getInstance().user;
        var goods = GameData.getInstance().goods;
        var changeData = null;
        if(type == WatchAdType.Lobby)
        {
            var curTime = Date.now();
            var deltaTime = curTime - goods.lastGoldTime;
            if(deltaTime < this.VideaCDTime)
            {
                return {code:ECode.FAIL};
            }
            changeData = {gold:this.WatchVideaGetGold,lastGoldTime:deltaTime};
        }
        else if(type == WatchAdType.BattleEnd)
        {
            if(user.lastBattleGold < 1)
            {
                return {code:ECode.FAIL};
            }
            changeData = {gold:user.lastBattleGold};
            user.lastBattleGold = 0;
        }
        else
        {
            return {code:ECode.FAIL};
        }
        goods.updateWidthChangeData(changeData);
        return {code:ECode.OK};
    }

    p.uploadBattleResult = function(msg){
        var battleType = msg.battleType,score=msg.score,task=msg.task,goldRatio=msg.goldRatio;
        var curTime = Date.now();
        var user = GameData.getInstance().user;
        var goods = GameData.getInstance().goods;
        if(curTime < user.lastBattleEndTime + this.FightTimeMS)
        {
            return {code:ECode.FAIL};
        }
        user.lastBattleEndTime = curTime;
        var gold = 0;
        if(battleType == GameMode.Grade) {
            var gradeData = DataMgr.getInstance().getGradeDataByStar(user.star);
            gold = this.calGoldByGradeStar(gradeData.grade,task,goldRatio);
            if(task == 1) {
                user.setStar(user.star + 1);
            }
        }
        else {
            gold = this.calGoldByBattleScore(score,goldRatio);
        }
        user.lastBattleGold = gold;
        var changeData = {gold:gold};
        goods.updateWidthChangeData(changeData);
        return {code:ECode.OK};
    }

    p.dailyPrize = function(msg){
        var prize = msg.prize;
        var goods = GameData.getInstance().goods;
        if(goods == null || goods.dailyPrize > 0)
        {
            return {code:ECode.FAIL};
        }
        var changeData = {dailyPrize:prize};
        if(prize == 1) {
            changeData.gold = this.DailyPrizeReviveStone;//给金币
        }
        goods.updateWidthChangeData(changeData);
        return {code:ECode.OK};
    }

    p.growProp = function(msg){
        var id = msg.id;
        var user = GameData.getInstance().user;
        var goods = GameData.getInstance().goods;
        var lv = user.grow[id] || 0;
        var nextLv = lv + 1;
        var cfg = DataMgr.getInstance().getGrowPropCfg(id,nextLv);
        if(cfg == null) {
            return {code:ECode.FAIL};
        }
        var needGold = cfg.cost;
        if(goods.gold < needGold) {
            return {code:ECode.FAIL};
        }
        var changeData = {gold:-needGold};
        goods.updateWidthChangeData(changeData);
        return {code:ECode.OK,id:id};
    }

    p.costGold = function(msg){
        var cost = msg.cost;
        var goods = GameData.getInstance().goods;
        if(cost <=0 || goods.gold < cost) {
            return {code:ECode.FAIL};
        }
        var changeData = {gold:-cost};
        goods.updateWidthChangeData(changeData);
        return {code:ECode.OK};
    }

    p.calGoldByBattleScore = function(score,goldRatio){
        var gold = Math.floor(score * this.ScoreGoldRatio);
        gold = Math.ceil(gold * goldRatio);
        if(gold > this.ScoreGoldMax) 
            gold = this.ScoreGoldMax;
        else if(gold < this.ScoreGoldMin)
            gold = this.ScoreGoldMin;
        return gold;
    }

    p.calGoldByGradeStar = function(grade,star,goldRatio){
        var cfg = DataMgr.getInstance().getUserGradeCfg(grade);
        var gold = cfg.staticGold || 0;
        gold = Math.ceil(gold * goldRatio);
        if(star == 1)
            gold += cfg.addGold || 0;
        return gold;
    }
    
    return MiniServer;
}());