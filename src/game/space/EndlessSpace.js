/*
* name;
*/
var EndlessSpace = (function () {
    var EndlessSpace = Class(Space);
    var p = EndlessSpace.prototype;
    
    p.__EndlessSpace_ctor = p.ctor;
    p.__EndlessSpace_preStart = p.preStart;
    p.__EndlessSpace_start = p.start;
    p.__EndlessSpace_update = p.update;
    p.__EndlessSpace_end = p.end;
    p.__EndlessSpace_exit = p.exit;

    p.ctor = function() {
        this.__EndlessSpace_ctor();
        this.m_aiCfgId = 1;
        this.m_gameMode = GameMode.Endless;
        this.m_highestScore = 10000;    //今日最高分
        this.m_highestPlayerName = "test"; //今日最高的玩家名字
        this.m_reviveCnt = 0;
        this.m_maxReviveCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.EndlessMaxReliveCnt)
        this.m_lastOverFriendIndex = -1;
        this.m_switchAILeftTime = 0;
        this.m_curAiLevel = 1;
        this.reportUrl = GameConst.PHPUrl+"infinite_stat/";
        this.openId = "";
        this.nickName = GameData.getInstance().user.uname;
        this.m_firstReviveTime = 0;
        this.init();
    }

    p.init = function(){
        // if(typeof(GameStatusInfo) == "undefined"){
        //     this.openId = "F7B33F2B3913EAF07D31DFBE96562BE1";
        // }else{
        //     this.openId = GameStatusInfo.openId;
        // }
        this.openId = GameData.getInstance().user.openid;
        RankMgr.getInstance().queryFriendRank(RankType.Endless,true);
    }

    p.preStart = function(playerName){
        this.m_battleTime = 0;
        TimerUtil.loop(1000,this,this.checkSwitchAITimer);
        this.registerEvent();
        GameMgr.getInstance().clearGameCache();
        this.clearBattleCache();

        var role = this.__EndlessSpace_preStart(playerName);

        this.calcSwitchAITime();
        this.fetchHighestScore();

        return role;
    }

    p.start = function(){
        this.__EndlessSpace_start();
        this.m_battleBeginTime = Laya.timer.currTimer;
        SDKMgr.getInst().report(ReportType.Start_EndlessFight);
        this.report(ReportType.Start_EndlessFight,{'openid':this.openId,'nick':this.nickName});
    }

    p.end = function(){
        this.unregisterEvent();
        Utils.localStorageAddVal("fightCnt_endless",1);
        this.__EndlessSpace_end();
    }

    p.exit = function(){
        var params = {'openid':this.openId,'nick':this.nickName,'reborn':this.m_reviveCnt,'first_reborn_time':this.m_firstReviveTime,'kill':this.role.getKillNum(),'score':this.role.getHighScore()};
        SDKMgr.getInst().report(ReportType.End_EndlessFight,params);
        this.report(ReportType.End_EndlessFight,params);
        this.__EndlessSpace_exit();
    }

    p.onMainRoleDie = function(){
        if(this.m_reviveCnt == this.m_maxReviveCnt){
            EventMgr.getInstance().event(EEvent.FightOver);
            return;
        }

        if(GameMgr.getInstance().getInvincibleCnt() < 2){
            TimerUtil.once(500,this,function(){
                UIMgr.getInstance().openUI(EUI.InvincibleView);
            });
        }else
        {
            var leftCnt = this.m_maxReviveCnt - this.m_reviveCnt;
            UIMgr.getInstance().showUI(EUI.EndlessOneLifeView,{highestScore:this.m_highestScore,leftReliveCnt:leftCnt,name:this.m_highestPlayerName});
        }
    }

    p.onMainRoleRevive = function(){
        GameMgr.getInstance().updateHistoryScore(this.role.getHighScore());
        RankMgr.getInstance().updateSelfRankScore(this.role.getHighScore());
        this.m_reviveCnt++;
        if(this.m_reviveCnt == 1)
            this.m_firstReviveTime = TimerUtil.currTimer() * 0.001;
    }

    p.getEndlessHighest = function(){
        return {name:this.m_highestPlayerName,score:this.m_highestScore};
    }

    //获取今日最高分
    p.fetchHighestScore = function(){
        var _this = this;
        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                EventMgr.getInstance().event(EEvent.Error,"\nerror:"+err);
            }
            else {
                _this.m_highestScore = parseInt(data.data.score);
                _this.m_highestPlayerName = data.data.nick;
                EventMgr.getInstance().event(EEvent.RefreshEndlessHighest);
            }
        });

        http.sendGetWithUrl(GameConst.PHPUrl+"top_score/daily_max_score");
    }

    p.report = function(type,params){
        var url = this.getReportUrl(type);
        if(url == null) return;
        
        var paramStr = Utils.parseParams(params);

        var http = new HttpLaya(function(err, data) {
            if(err != null) {
                EventMgr.getInstance().event(EEvent.Error,"\nerror:"+err);
            }
            else {
                if(data.result != 0) {
                    EventMgr.getInstance().event(EEvent.Error,data);
                }
            }
        });
        http.sendPostWithUrl(url,paramStr);
    }

    p.getReportUrl = function(type){
        switch(type){
            case ReportType.Start_EndlessFight:
                return this.reportUrl + "game_begin";
            case ReportType.End_EndlessFight:
                return this.reportUrl + "endless_over";
            default:
                return null;
        }
    }

    p.checkSwitchAITimer = function(){
        this.m_switchAILeftTime--;
        if(this.m_switchAILeftTime == 0){
            this.calcSwitchAITime();
        }
    }

    p.calcSwitchAITime = function(){
        var cfg = DataMgr.getInstance().getEndlessAICfg(this.m_aiCfgId);
        if(cfg == null){
            TimerUtil.clear(this,this.checkSwitchAITimer);
            return;
        }
        this.m_switchAILeftTime = cfg.duration;
        this.m_curAiLevel = cfg.aiId;   
        this.updateAiLevel(this.m_curAiLevel);
        this.m_aiCfgId++;
    }

    p.registerEvent = function(){
        EventMgr.getInstance().on(EEvent.MainRoleDie,this,this.onMainRoleDie);
        EventMgr.getInstance().on(EEvent.MainRoleRevive,this,this.onMainRoleRevive);
    }

    p.unregisterEvent = function(){
        EventMgr.getInstance().off(EEvent.MainRoleDie,this,this.onMainRoleDie);
        EventMgr.getInstance().off(EEvent.MainRoleRevive,this,this.onMainRoleRevive);
    }

    p.getNextGoalTip = function(historyScore,highScore,bMainView){
        var content = "";
        var rankList = RankMgr.getInstance().EndlessFriendRankList();
        if(rankList.length == 0){
            if(historyScore > highScore)
            {
                 var tipId = 107;
                 if(bMainView) tipId = 104;
                 content = DataMgr.getInstance().getContentById(tipId);
            }
        }else
        {
            var index = RankMgr.getInstance().overFriendIndex(highScore);
            if(index == 0)
            {
                var tipId = 107;
                if(bMainView) tipId = 104;
                content = DataMgr.getInstance().getContentById(tipId);
            }else
            {
                var data = rankList[index-1];
                if(data.selfFlag)
                {
                    var tipId = 106;
                    if(bMainView) tipId = 103;
                    var deltaScore = data.score - highScore;
                    if(deltaScore == 0)
                    {
                        tipId = 107;
                        if(bMainView) tipId = 104;
                        content = DataMgr.getInstance().getContentById(tipId);
                    }
                    else
                    {
                        var strParam = [];
                        strParam.push(deltaScore);
                        content = StringUtil.format(DataMgr.getInstance().getContentById(tipId),strParam);
                    }
                }else
                {
                    var tipId = 105;
                    if(bMainView) tipId = 102;
                    var deltaScore = data.score - highScore;
                    if(deltaScore == 0)
                    {
                        tipId = 107;
                        if(bMainView) tipId = 104;
                        content = DataMgr.getInstance().getContentById(tipId);
                    }
                    else
                    {
                        var strParam = [];
                        strParam.push(deltaScore);
                        strParam.push(data.nick);
                        content = StringUtil.format(DataMgr.getInstance().getContentById(tipId),strParam);
                    }
                }
            }
            if(this.m_lastOverFriendIndex != index){
                this.m_lastOverFriendIndex = index;
                EventMgr.getInstance().event(EEvent.Main_OverFriend_Change);
            }
        }

        RankMgr.getInstance().updateSelfRankScore(highScore);

        return content;
    }

    return EndlessSpace;
}());