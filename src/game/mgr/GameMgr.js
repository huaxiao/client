var Brower = Laya.Browser;
var MathUtil = Laya.MathUtil;
var Pool = Laya.Pool;

/*
* 游戏管理器
*/
var GameMgr = (function () {
    var UpdateRankTimer = 1000;

    function GameMgr() {
        this.model = "";
        this.m_launchTime = TimerUtil.currTimer();
        this.reset();
        this.m_isMobile = Utils.onMobile();
        window.onunload = onunload_handler;
        Laya.stage.on(Laya.Event.RESIZE,this, this.onScreenResize);
        this.onScreenResize();
    }

    function onunload_handler(){   
        SDKMgr.getInst().report(ReportType.Logout);
    }   

    /**
     * 单例
     */
    GameMgr.getInstance = function(){
        if(GameMgr._instance == null){
            GameMgr._instance = new GameMgr();
        }
        return GameMgr._instance;
    }

    var p = GameMgr.prototype;

    p.isLowDevice = function(){
        if(this.model.indexOf("iphone 5")>=0 || this.model.indexOf("iphone 6")>=0){
            return true;
        }

        return false;
    }
    
    p.registerEvent = function(){
        EventMgr.getInstance().on(EEvent.CheckSpawnBallCompleted,this,this.checkBallVisible);
        EventMgr.getInstance().on(EEvent.FightOver,this,this.fightOver);
        EventMgr.getInstance().on(EEvent.RefreshFriendRank,this,this.onRefreshHistory);
        EventMgr.getInstance().on(EEvent.PrepareBattleCompleted,this,this.onPrepareBattleOk);
    }

    p.unregisterEvent = function(){
        EventMgr.getInstance().off(EEvent.CheckSpawnBallCompleted,this,this.checkBallVisible);
        EventMgr.getInstance().off(EEvent.FightOver,this,this.fightOver);
        EventMgr.getInstance().off(EEvent.RefreshFriendRank,this,this.onRefreshHistory);
        EventMgr.getInstance().off(EEvent.PrepareBattleCompleted,this,this.onPrepareBattleOk);
    }

    p.onScreenResize = function(){
        this.m_halfBallViewW = Math.round(Laya.stage.width / 2 + 50);
        this.m_halfBallViewH = Math.round(Laya.stage.height / 2 + 50);

        this.m_halfPlayerViewW = Math.round(Laya.stage.width / 2 + 240);
        this.m_halfPlayerViewH = Math.round(Laya.stage.height / 2 + 240);
    }

    p.getOnlineTime = function(){
        return (TimerUtil.currTimer() - this.m_launchTime)/1000;
    }

    p.reset = function(){
        this.m_battleCnt = 0;  //统计战斗次数
        this.m_gameMode = GameMode.Normal;
        this.m_roleRank = 0;    //自己排名
        this.m_role = null;     //主角
        
        this.m_curMap = null;
        this.m_mapActor = null;
        this.m_isInBattle = false;
        this.m_nextKillScoreAchieve = 1000;
        this.m_reconnetenterbattle = false;
        
        this.m_shareCnt = 0;    //分享次数
        this.m_invincibleCnt = 0;//无敌次数
        this.m_lastVisibleBall = {};
        this.m_showRelieveAd = false;
        this.m_showAdCount = 0;
        this.m_lastLeftTime = null;

        this.m_space = null;

        this.readBattleCnt();
    }

    p.onRefreshHistory = function(){
        this.m_historyHighScore = RankMgr.getInstance().m_historyHighScore;
    }

    p.setAdReward = function(showed){
        this.m_showRelieveAd = showed;
    }

    p.isAdReward = function(){
        return this.m_showRelieveAd;
    }

    p.addShowAdNum = function(){
        this.m_showAdCount++;
    }

    p.showAdNum = function(){
        return this.m_showAdCount;
    }

    p.getNextGoalTip = function(bMainView){
        return this.m_space.getNextGoalTip(this.m_historyHighScore,this.m_role.getAvatar().getHighScore(),bMainView);
    }

    p.getNextGoalTip = function(bMainView){
        var highScore = this.m_role.getAvatar().getHighScore();
        var openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            text: "NextGoalTip",
            mainView: bMainView,
            historyScore: this.m_historyHighScore,
            highScore: highScore,
            openid: GameData.getInstance().user.openid
        });
    }

    p.prepareBattle = function(gameMode){
        this.registerEvent();
        this.collect();
        this.m_gameMode = gameMode;
        if(this.m_gameMode == GameMode.Grade){
            this.m_space = new GradeSpace();
        }else if(this.m_gameMode == GameMode.Endless){
            this.m_space = new EndlessSpace();
        }else{
            alert("游戏模式不对!!");
            return;
        }

        MapMgr.getInstance().buildMap();
        this.m_curMap = MapMgr.getInstance().getMap();
        this.m_mapActor = new r2.GameMapActor();
        this.m_mapActor.hide();

        this.m_role = this.m_space.preStart(GameData.getInstance().user.uname);
        this.readGameData();

        this.updateRankData();
        this.checkPlayerVisible();
        this.m_role.setVisible(true);
    }

    p.onPrepareBattleOk = function(){
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

    //进入单机战斗
    p.enterBattle = function(){
        this.m_isBattleEnd = false;
        this.m_reconnetenterbattle = false;        

        TimerUtil.frameLoop(1,this,this.onFrameUpdate);
        TimerUtil.loop(UpdateRankTimer,this,this.updateRankData);
        TimerUtil.once(100,this,this.initRankData);

        this.m_space.start();

        MapMgr.getInstance().setBroadcastMsgCallback(this.onBroadcastCallback,this);

        this.m_isInBattle = true;
        this.m_battleStartTime = Date.now();
        this.m_mapActor.show();

        this.AddBattleCnt();
    }

    //战斗结束，进行结算，弹出结算界面
    p.fightOver = function(){
        this.m_isBattleEnd = true;
        this.updateRankData();
        TimerUtil.clearAll(this);
        MapMgr.getInstance().getBattleSettlementData();
        var p = this.m_role.getAvatar();
        var goldRatio = p.getBuffVal(BuffType.IncSettleGold);

        var highScore = p.getHighScore();        
        var newHis = highScore > this.m_historyHighScore;
        if(newHis) this.m_historyHighScore = highScore;

        var taskResult = TaskMgr.getInstance().getResult();
        var star = GameData.getInstance().user.star;
        if(taskResult == 1) star += 1;
        
        ServerAgency.getInstance().rpcBattleResult(this.m_gameMode,highScore,taskResult,goldRatio,Laya.Handler.create(this,function(){}));

        var data ={'highScore':highScore,'killNum':p.getKillNum(),'new':newHis,'rank':this.m_roleRank};
        this.beforSettlement(data);

        this.m_space.end();

        if(this.isGradeMode()) {
            highScore = 0;
        }
        else {
            star = 0;
        }
        SDKMgr.getInst().uploadScore(this.m_battleStartTime,highScore,star);
    }

    p.beforSettlement = function(data){
        this.handleSettlement(data);
    }

    //显示结算界面
    p.handleSettlement = function(data){
        ShakeInst.stopShake();

        if(this.isGradeMode()) {
            TimerUtil.once(500,this,function(){
                UIMgr.getInstance().toUI(EUI.SettlementView,data);
            });
        }
        else {
            UIMgr.getInstance().toUI(EUI.EndlessSettlementView,data);
        }

        BroadcastMgr.getInstance().clear();
        this.m_space.preEnd();
        this.m_isBattleEnd = true;
        TimerUtil.clear(this,this.onFrameUpdate);
    }

    p.preExitBattle = function(){
        UIMgr.getInstance().openUI(EUI.AttributeView,{start:false});
    }

    p.exitBattle = function(noStartUI){
        this.saveHighScore(this.m_role.getHighScore());
        this.unregisterEvent();
        if(this.m_space!=null){
            this.m_space.exit();
            this.m_space = null;
        }

        this.clear();
        this.m_isInBattle = false;
        if(!noStartUI)
            UIMgr.getInstance().toUI(EUI.Start);
        ServerAgency.getInstance().reset();

        this.collect();
    }
    
    p.onFrameUpdate = function(){
        if(this.m_space == null || this.m_space.isPause()) return;

        MapMgr.getInstance().update();
        var currFrame = TimerUtil.currFrame();
        if(currFrame % 5 == 0)
        {
            this.checkBallVisible();
        }

        if(currFrame % 3 == 0){
            this.checkPlayerVisible();
        }

        if((currFrame % 60 == 0))
        {
            this.saveGameData();
        } 

        this.m_space.update();     
        
        this.onMove();

        if(this.m_mapActor && this.m_role && !ShakeInst.isShaking())
            this.m_mapActor.lookAt(this.m_role);
    }
    
    p.setGamePause = function(isPause){
        this.m_space.setGamePause(isPause);
    }

    p.getSpace = function(){
        return this.m_space;
    }

    p.isGradeMode = function(){
        return this.m_space!= null && this.m_space.isGradeMode();
    }

    p.isEndlessMode = function(){
        return this.m_space!= null && this.m_space.isEndlessMode();
    }

    p.getLeftTime = function(){
        return this.m_space.getLeftTime();
    }
   
    p.onOneLifeDead = function(){
        var leftTime = this.getLeftTime();

        this.m_liveTime = 0;
        if(this.m_lastLeftTime==null) {
            this.m_liveTime = this.m_space.getTotalTime() - leftTime;
        }
        else {
            this.m_liveTime = this.m_lastLeftTime - leftTime;
        }
        this.m_lastLeftTime = leftTime;
        TimerUtil.once(500,this,this.showOneLifePage);
    }

    p.showOneLifePage = function(){
        UIMgr.getInstance().showUI(EUI.OneLifeView);
    }

    p.getLiveTime = function(){
        return this.m_liveTime;
    }

    p.oneLifeRevive = function(isShared){
        this.m_role.getAvatar().onRevive(isShared);
        var cnt = parseInt(Laya.LocalStorage.getItem("dailyReviveCnt")) || 0;
        cnt += 1;
        Laya.LocalStorage.setItem("dailyReviveCnt",cnt);
    }

    p.addShareCnt = function(addCnt){
        this.m_shareCnt += addCnt;
    }

    p.setRoleInvincible = function(){
        this.m_invincibleCnt += 1;
        this.setGamePause(false);
        var role = this.m_role.getAvatar();
        role.onRevive(true,true);
        role.setInvincible(true);
    }

    p.killAllAIPlayer = function(){
        this.m_space.killAllAIPlayer();
    }

    p.GetPlayerById = function(id){
        if(this.m_space ==null) return null;
        var players = this.getPlayers();

        var len = players.length;
        for(var i=0; i<len; i++) {
            var player = players[i];
            if(player != null && player.getId() == id)
                return player;
        }
        return null;
    }

    p.initRankData = function(){
        this.updateRankData();
    }

    p.updateRankData = function(){
        var oldRank = this.m_roleRank;

        this.m_roleRank = this.m_space.calcRank(this.m_role.getId(),oldRank);
        if(GameMgr.getInstance().hasTask())
            GameMgr.getInstance().checkTask({endRank:this.m_roleRank});

        if(this.m_roleRank == 1 && oldRank != 1){
            BroadcastMgr.getInstance().showLocalBroadcast(KDAType.RankOne);
        }else if(this.m_roleRank <= 10 && oldRank > 10){
            BroadcastMgr.getInstance().showLocalBroadcast(KDAType.RankInTen);
        }

        EventMgr.getInstance().event(EEvent.Player_Rank_Update); 
    }

    p.getPlayers = function(){
        return this.m_space.getPlayers();
    }

    var lastVisibleBallTmp = [];
    p.checkBallVisible = function(){
        var px = this.m_role.x,py = this.m_role.y,ball;

        lastVisibleBallTmp.length = 0;

        var balls = MapMgr.getInstance().m_quadTree.retrieve(this.m_role.getAvatar().getQuadtreeObject());
        if(balls!=null)
        {
            for(var i = balls.length-1; i >= 0;i--){
                ball = balls[i];
                if(ball==null || ball.getActor() == null || !Utils.validPos(px,py,ball.x,ball.y,this.m_halfBallViewW,this.m_halfBallViewH)) continue;
                ball.getActor().setVisible(true);
                delete this.m_lastVisibleBall[ball.getId()];
                lastVisibleBallTmp.push(ball);
            }
        }

        var balls = this.m_space.getBalls();
        var ballActor;
        for(var index in this.m_lastVisibleBall) {
            ball = this.m_lastVisibleBall[index];
            if(ball !== null)
                ballActor = balls[ball.getId()];
                if(ballActor)
                    ballActor.setVisible(false);
            delete this.m_lastVisibleBall[index];
        }

        for(var i = lastVisibleBallTmp.length-1;i>=0;i--){
            ball = lastVisibleBallTmp[i];
            this.m_lastVisibleBall[ball.getId()] = ball;
        }
    }

    p.checkPlayerVisible = function(){
        var players = this.getPlayers();
        var px = this.m_role.x, py = this.m_role.y;
        var player = null;
        for(var i = players.length - 1; i >= 0; i--){
            player = players[i];
            if(player == null || player.isDead()) continue;

            if(Utils.validPos(player.x,player.y,px,py,this.m_halfPlayerViewW,this.m_halfPlayerViewH)){
                player.setInView(true);
            }
            else{
                player.setInView(false);
            }
        }
    }
 
    p.onMove = function() {
        if(this.m_isMobile || this.m_role == null || this.m_role.avatar.m_isAI) return;

        var mouseX = this.m_mapActor.m_sprite.mouseX;
        var mouseY = this.m_mapActor.m_sprite.mouseY;

        var x = this.m_role.x;
        var y = this.m_role.y;
        
        var dx = Math.abs(mouseX - x);
        var dy = Math.abs(mouseY - y);
        if(dx <=2 || dy <= 2) return;

        var oldRotate = this.m_role.getModelRotation();
        var rotate = MathUtil.getRotation(x,y,mouseX,mouseY);
        if(isNaN(rotate))
            rotate = 0;
        if(oldRotate != rotate && Math.abs(rotate - oldRotate)>=3){
            this.m_role.setModelRatation(rotate);
        }
    }

    p.onPlayerAttack = function() {
        this.m_role.getAvatar().attack();
    }

    p.onPlayerSpeedUp = function() {
        this.m_role.getAvatar().speedup();
    }

    p.onRemoveBall = function(ballActor){
        this.m_space.removeBall(ballActor);
    }

    p.clear = function(){
        if(this.m_isInBattle == false)
            return;
        
        TimerUtil.clearAll(this);
        this.m_mapActor.destroy();
        MapMgr.getInstance().clear();
        this.clearData();
        this.clearGameCache();
    }

    p.clearData = function(){
        this.m_roleRank = 0;    //自己排名
        this.m_role = null;     //主角
        
        this.m_curMap = null;
        this.m_mapActor = null;
        this.m_isInBattle = false;
        
        
        this.m_nextKillScoreAchieve = 1000;
        this.m_reconnetenterbattle = false;
        
        this.m_shareCnt = 0;    //分享次数
        this.m_invincibleCnt = 0;
        Utils.clearDictionary(this.m_lastVisibleBall);
        this.m_showRelieveAd = false;
        this.m_lastLeftTime = null; 
        this.m_showAdCount = 0;
    }

    p.incKillScoreAchieve = function(){
        this.m_nextKillScoreAchieve += 1000;
    }

    p.getNextKillScoreAchieve = function(){
        return this.m_nextKillScoreAchieve;
    }

    p.onBroadcastCallback = function(proto,data){
        BroadcastMgr.getInstance().addNewContent(data);
    }

    p.checkDailyPrize = function(){
        var prizeView = UIMgr.getInstance().findUI(EUI.DailyReviveView);
        if(prizeView != null) return;

        var user = GameData.getInstance().user;
        if(user.isServerData == false) return;

        if(GameData.getInstance().goods.dailyPrize == 1) return;

        var createTime = user.createTime;
        var createDay = new Date(createTime).getDate();
        if(createDay == new Date().getDate()) {
            var newUserFightCnt = parseInt(Laya.LocalStorage.getItem("newUserFightCnt")) || 0;
            var cfgFightCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.NewUserFightCnt) || 1;
            if(newUserFightCnt < cfgFightCnt) {
                return;
            }
        }

        TimerUtil.once(500,this,function(){
            UIMgr.getInstance().openUIUnique(EUI.DailyReviveView);
        });
    }

    p.needShowVideoAdView = function(){
        var createTime = GameData.getInstance().user.createTime;
        var createDay = new Date(createTime).getDate();
        if(createDay == new Date().getDate()) {
            var newUserFightCnt = parseInt(Laya.LocalStorage.getItem("newUserFightCnt")) || 0;
            var cfgFightCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.VideoAdViewNeedFight) || 1;
            if(newUserFightCnt < cfgFightCnt) {
                return false;
            }
        }
        return true;
    }

    p.checkNoInvincible = function(playerLv){
        var cfgInvincibleCnt = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.InvincibleCnt) || 1;
        if(this.m_invincibleCnt < cfgInvincibleCnt && playerLv >= DataMgr.getInstance().getGlobalCfg(EGlobalCfg.LvOpenInvincibleView)) {
            TimerUtil.once(500,this,function(){
                UIMgr.getInstance().openUI(EUI.InvincibleView);
            });
            return false;
        }
        return true;
    }

    p.GetBattleCnt = function(){
        return this.m_battleCnt;
    }

    p.AddBattleCnt = function(){
        this.m_battleCnt++;
        this.saveBattleCnt();
    }

    p.saveBattleCnt = function(){
        Laya.LocalStorage.setItem("battleCnt",this.m_battleCnt);
    }

    p.readBattleCnt = function(){
        this.m_battleCnt = parseInt(Laya.LocalStorage.getItem("battleCnt")) || 0;

        if(typeof(GameStatusInfo) != "undefined" && !GameStatusInfo.isFirstInstall && this.m_battleCnt<2)
        {
            this.m_battleCnt = 2;
        }
    }

    p.saveGameData = function(){
        Laya.LocalStorage.setItem("shareCnt", this.m_shareCnt);
        Laya.LocalStorage.setItem("invincibleCnt", this.m_invincibleCnt);
    }

    p.readGameData = function(){
        this.m_shareCnt = parseInt(Laya.LocalStorage.getItem("shareCnt")) || 0;
        this.m_invincibleCnt = parseInt(Laya.LocalStorage.getItem("invincibleCnt")) || 0;
        this.m_historyHighScore = parseInt(Laya.LocalStorage.getItem("highScore")) || 0;
        this.m_oldHighScore = this.m_historyHighScore;  
    }

    p.saveHighScore = function(highScore){
        if(this.isEndlessMode() && highScore > this.m_oldHighScore)
            Laya.LocalStorage.setItem("highScore", highScore);
    }

    p.clearGameCache = function(){
        Laya.LocalStorage.removeItem("shareCnt");
        Laya.LocalStorage.removeItem("invincibleCnt");
    }

    p.getInvincibleCnt = function(){
        return this.m_invincibleCnt;
    }

    p.getEndlessHighest = function(){
        return this.m_space.getEndlessHighest();
    }

    p.updateHistoryScore = function(highScore){
        if(highScore > this.m_historyHighScore){
            this.m_historyHighScore = highScore;
        }
    }

    p.collect =  function(){
        if(typeof(wx) == "undefined") return;

        wx.triggerGC();
    }

    p.hasTask = function(){
        if(this.m_space == null) return false;

        return this.isGradeMode();
    }

    p.checkTask = function(data){
        if(this.m_space!=null){
            this.m_space.checkTask(data);
        }
    }

    return GameMgr;
}());

GameMgr._instance = null;