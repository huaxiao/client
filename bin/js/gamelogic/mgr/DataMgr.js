// var GameConst = require('../../../consts/GameConst');

/*
* 配置数据管理器
*/
var DataMgr = (function () {
    DataMgr.EnergyBallPoolSign = "EnergyBall";
    DataMgr.EnergyBallPoolSignFromPlayer = "EnergyBallFromPlayer";
    DataMgr.BallActorPoolSign = "BallActor";
    DataMgr.BallActorPoolSignFromPlayer = "BallActorPoolSignFromPlayer";
    DataMgr.PlayerActorPoolSign = "PlayerActor";
    
    function DataMgr() {
        this.reset();

        EventMgr.getInstance().on(EEvent.LoadOnlineVideoCfgOk,this,this.parseOnlineVideoCfg);
    }

     /**
     * 单例模式
     */
    DataMgr.getInstance = function () {
        if (DataMgr._instance == null) {
            DataMgr._instance = new DataMgr();
        }
        return DataMgr._instance;
    };

    var p = DataMgr.prototype;

    p.reset = function() {
        this.playerCfgData = null;
        this.ballCfgData = null;
        this.killballCfgData = null;
        this.m_totalMapBallCnt = 0;
        this.m_scoregroup = {};
        this.m_ballRadiusDic = {};
        this.m_ballPoolSignDic = {};
        this.m_cosVals = {};
        this.m_sinVals = {};
        this.m_loaded = false;
    }

    p.isLoaded = function(){
        return this.m_loaded;
    }

    p.init = function(){
        var cfg = null;
        for(var id in this.killballCfgData){
            cfg = this.killballCfgData[id];

            if(cfg == null) continue;

            var score = [];
            for(var i =3; i<=9;i++){
                score.push(i * cfg.ratio);
            }

            this.m_scoregroup[id] = score;
        }


        this.m_totalMapBallCnt = 0;
        this.m_ballRadiusDic = {};
        for(var id in this.ballCfgData){
            cfg = this.ballCfgData[id];

            if(cfg == null) continue;
            this.m_totalMapBallCnt+=cfg.count;
            this.m_ballRadiusDic[cfg.exp] = cfg.radius;
            this.m_ballPoolSignDic[cfg.exp] = DataMgr.EnergyBallPoolSign+'_'+cfg.exp;
        }

        for(var i=0; i < 360;i++){
            var rad = i * Math.PI / 180;
			this.m_cosVals[i] = Math.cos(rad);
			this.m_sinVals[i] = Math.sin(rad);
		}	

        var i=0;
        while(true) {
            if(this.userGradeCfgData[++i] == null) {
                this.m_maxUserGrade = i-1;
                GameData.getInstance().user.resetStar();
                break;
            }
        } 

        SDKMgr.getInst().uploadGradeData();
    }

    p.getBallPoolSinName = function(exp) {
        var name = this.m_ballPoolSignDic[exp];
        if(name == null) {
            name = DataMgr.EnergyBallPoolSign+'_'+exp;
            this.m_ballPoolSignDic[exp] = name;
        }
        return name;
    }


    p.loadClientData = function(){
        if(this.m_loaded) return;

        this.playerCfgData = Laya.loader.getRes("res/cfg/player.json");
        this.ballCfgData = Laya.loader.getRes("res/cfg/energyball.json");
        this.killballCfgData = Laya.loader.getRes("res/cfg/killball.json");
        this.roomCfgData = Laya.loader.getRes("res/cfg/room.json");
        this.ainameCfgData = Laya.loader.getRes("res/cfg/ainameconfig.json");
        this.userCfgData = Laya.loader.getRes("res/cfg/user.json");
        this.globalCfgData = Laya.loader.getRes("res/cfg/globalcfg.json");
        this.textCfgData = Laya.loader.getRes("res/cfg/text.json");
        this.cellweightCfgData = Laya.loader.getRes("res/cfg/cellweight.json");
        this.buffCfgData = Laya.loader.getRes("res/cfg/buff.json");
        this.videoCfgData = Laya.loader.getRes("res/cfg/videoShareCfg.json");
        this.limitedCfgData = Laya.loader.getRes("res/cfg/limitedCity.json");
        this.aidifficultyCfg = Laya.Loader.getRes("res/cfg/AIDifficultyCfg.json");
        this.userGradeCfgData = Laya.loader.getRes("res/cfg/userGrade.json");
        this.endlessAiCfgData = Laya.loader.getRes("res/cfg/endlessAiCfg.json");
        this.skinCfgData = Laya.loader.getRes("res/cfg/skinCfg.json");
        this.shopCfgData = Laya.loader.getRes("res/cfg/shop.json");
        this.growPropCfgData = Laya.loader.getRes("res/cfg/growProp.json");
        this.reportCfgData = Laya.loader.getRes("res/cfg/reportCfg.json");
        this.bannerCfgData = Laya.loader.getRes("res/cfg/bannerCfg.json");

        this.init();
        this.parseOnlineVideoCfg();
        this.m_loaded = true;
    }
    

    p.loadServerData = function(){
        this.playerCfgData = require('../../../../config/data/player.json');
        this.ballCfgData = require('../../../../config/data/energyball.json');
        this.killballCfgData = require("../../../../config/data/killball.json");
        this.roomCfgData = require('../../../../config/data/room.json');
        this.userCfgData = require('../../../../config/data/user.json');
        this.ainameCfgData = require("../../../../config/data/ainameconfig.json");
        this.globalCfgData = require("../../../../config/data/globalcfg.json");
        this.cellweightCfgData = require("../../../../config/data/cellweight.json");
        this.buffCfgData = require("../../../../config/data/buff.json");
        this.userGradeCfgData = require("../../../../config/data/userGrade.json");
        this.shopCfgData = require("../../../../config/data/shop.json");

        this.init();
    }

    p.parseOnlineVideoCfg = function(){
       var dataList =  ResMgr.getInstance().onlineVideoShareCfg;
       if(dataList == null || this.videoCfgData == null) return;

        for(var i = 0; i < dataList.length;i++){
           var data = dataList[i];
           var cfg = this.getVideoShareCfg(data.pos);
           if(cfg == null) continue;

           cfg.shareStep = data.shareStep;
           cfg.shareRatioA = data.shareRatioA;
           cfg.shareRatioB = data.shareRatioB;
           cfg.shareRatioC = data.shareRatioC;
           cfg.imgUrl = data.imgUrl;
           cfg.shareContent = data.shareContent;
        }
    }

    p.getAIJson = function(ainame) {
        if(GameConst.Server){
            return require('../../../../config/btree/'+ainame);
        }else{
            return Laya.loader.getRes("res/btree/"+ainame+".json");
        }
    }

    p.getRoomCfgData = function(){
        if(this.roomCfgData == null) return null;
        return this.roomCfgData[1];
    }

    //获取死亡爆球配置
    p.getKillballCfg = function(score){
        var cfg = null;
        for(var id in this.killballCfgData)
        {
            cfg = this.killballCfgData[id];
            if(cfg == null) continue;

            if(cfg.minScore<=score && cfg.maxScore > score){
                return cfg;
            }
        }
        return null;
    }

    p.getKillballCfgById = function(id){
        var cfg = this.killballCfgData[id];
        return cfg;
    }

    //获取AI名字
    p.getAIName = function(id){
        if(this.ainameCfgData == null) return "";

        for(var i =this.ainameCfgData.length-1; i >= 0; i--){
            var cfg = this.ainameCfgData[i];
            if(cfg.id == id){
                return cfg.name;
            }
        }

        console.error('ai name is null,id',id);
        return "";
    }

    p.getAINameByIndex = function(index){
        if(index>=0 && index<this.ainameCfgData.length)
            return this.ainameCfgData[index].name;
        console.error('ai name is null,index',index);
        return "";
    }

    p.getAINameCount = function(){
        if(this.ainameCfgData == null) return 0;

        return this.ainameCfgData.length;
    }

    p.getPlayerLvBySumExp = function(exp){
        var cfg;
        var lv = 0;
        do {
            cfg = this.playerCfgData[++lv];
            if(cfg == null) break;
            exp -= cfg.exp;
        }
        while(exp > 0)
        return lv;
    }

    p.getScoreGroup = function(lv){
        var score = this.m_scoregroup[lv];
        return score;
    }

     p.GetBallCfgByExp = function(exp){
        var energyballJson = this.ballCfgData;
        for(var index in energyballJson) {
            var cfgNergyball = energyballJson[index];
            if(cfgNergyball.exp == exp)
                return cfgNergyball;  
        }
        return null;
    }

     p.getTotalEnergyByLevel = function(level){
        var total = 0;
        var playerJson = this.playerCfgData;
        var cfgPlayer = null;
        for(var i=1; i < level;i++)
        {
            cfgPlayer = playerJson[i.toString()];
            total += cfgPlayer.exp;
        }
        return total;
    }

    p.getUserLevelCfg = function(lv){
        if(this.userCfgData == null) return null;

        var cfg = this.userCfgData[lv];
        return cfg;
    }

    p.getGlobalCfg = function(id){
        if(this.globalCfgData == null) return null;
        
        var cfg = this.globalCfgData[id];
        if(cfg!=null){
            return cfg.value;
        }

        return null;
    }

    p.getContentById = function(id){
        if(this.textCfgData == null) return null;

        var cfg = this.textCfgData[id];
        if(cfg != null){
            return cfg.content;
        }

        return null;
    }

    p.getCellMaxBallCnt = function(row,col){
         if(this.cellweightCfgData == null) return null;

        var cfg = this.cellweightCfgData[row];
        if(cfg == null) return;
        var percent = cfg['col'+col];

        return Math.ceil(percent*this.m_totalMapBallCnt/100);
    }

    p.getBallRadius = function(exp){
        var r = this.m_ballRadiusDic[exp];
        if(r == null)
            return exp;
        return r;
    }

    p.getCos = function(angle){
        var val = this.m_cosVals[angle];
        return val;
    }

    p.getSin = function(angle){
        var val = this.m_sinVals[angle];
        return val;
    }

    p.getBuffData = function(buffId){
         if(this.buffCfgData == null) return null;

        var cfg = this.buffCfgData[buffId];
        return cfg;
    }

    p.getVideoShareCfg = function(pos){
        if(this.videoCfgData == null) return null;

        for(var i = 0; i < this.videoCfgData.length;i++){
            if(this.videoCfgData[i].pos == pos){
                return this.videoCfgData[i];
            }
        }
        return null;
    }

    p.getAIDifficulty =function(aiId,playerLv){
        if(this.aidifficultyCfg == null) return null;

        for(var i = 0; i < this.aidifficultyCfg.length; i++){
            if(this.aidifficultyCfg[i].id == aiId && this.aidifficultyCfg[i].lv == playerLv)
                return this.aidifficultyCfg[i];
        }

        return null;
    }

    p.isLimitedCity = function(city){
        if(this.limitedCfgData == null) return false;

        for(var i = 0; i< this.limitedCfgData.length; i++){
            if(this.limitedCfgData[i].city == city)
                return true;
        }

        return false;
    }

    p.getUserGradeCfg = function(grade) {
        return this.userGradeCfgData[grade];
    }

    p.getUserGradeAIData = function() {
        var user = GameData.getInstance().user;
        var cfg = this.userGradeCfgData[user.grade];
        if(cfg == null)
            return null;
        var star = user.getGradeStar();
        if(cfg.aiID.length > star) {
            return cfg.aiID[star];
        }
        return null;
    }

    p.getMaxUserGrade = function(){
        return this.m_maxUserGrade;
    }

    p.getGradeDataByStar = function(star) {
        var grade = Math.ceil((parseInt(star)+1) / 4);
        grade = Utils.clamp(grade,1,this.m_maxUserGrade);
        if(grade == this.m_maxUserGrade) {
            star -= 4 * (grade - 1);
        }
        else {
            star = star % 4;
        }
        return {grade:grade,gradeStar:star};
    }

    p.getEndlessAICfg = function(id){
        if(this.endlessAiCfgData == null) return null;

        for(var i = 0; i < this.endlessAiCfgData.length; i++){
            if(this.endlessAiCfgData[i].id == id)
                return this.endlessAiCfgData[i];
        }

        return null;
    }

    p.getSkinCfg = function(skinId){
        if(this.skinCfgData == null) return null;

        for(var i = 0; i < this.skinCfgData.length; i++){
            if(this.skinCfgData[i].id == skinId)
                return this.skinCfgData[i];
        }

        return null;
    }

    p.getShopCfg = function(id){
        return this.shopCfgData[id];
    }

    p.getGrowPropCfg =function(id,lv){
        if(this.growPropCfgData == null) return null;

        var cfg;
        for(var i = 0,size=this.growPropCfgData.length; i < size; i++){
            cfg = this.growPropCfgData[i];
            if(cfg.id == id && cfg.lv == lv)
                return cfg;
        }

        return null;
    }

    p.getReportCfg = function(id){
        if(this.reportCfgData == null) return null;

        return this.reportCfgData[id];
    }

    p.getBannerCfg = function(pos){
        if(this.bannerCfgData == null) return null;

        for(var i = 0; i < this.bannerCfgData.length;i++){
            if(this.bannerCfgData[i].pos == pos){
                return this.bannerCfgData[i];
            }
        }
        return null;
    }

    return DataMgr;
}());

DataMgr._instance = null;