/*
* name;
*/
var Space = (function () {
    var CheckEnergyBallTimer = 10000;

    var Space = Class();
    var p = Space.prototype;

    p.ctor = function(){
        this.m_battleTime = 0;      //战斗总时长
        this.m_pause = false;
        this.m_leftBattleTime = 0;  //剩下的战斗时长
        this.m_battleBeginTime = 0; //战斗剩下开始时间
        this.m_gameMode = GameMode.Normal;

        this.m_players = [];    //游戏内玩家
        this.m_balls = {};      //场景上球对象
        this.m_garbageBalls = [];

        this.m_initSpawnBall = false;
        this.m_spawnGroupId = 0;

        this.m_checkSpawnBall = false;
        this.role = null;
    }

    p.getEndlessHighest = function(){
        return null;
    }

    p.getPlayers = function(){
        return this.m_players;
    }    

    p.getBalls = function(){
        return this.m_balls;
    }

    p.getLeftTime = function(){
        return this.m_leftBattleTime;
    }

    p.getTotalTime = function(){
        return this.m_battleTime;
    }

    p.preStart = function(playerName){
        this.m_spawnGroupId = 1;
        this.startSpawnEneryBall(); 

        var cacheUsersdata = this.readFightData();
        var mainRole = this.CreateRolePlayer(0,playerName,false);
        this.CreateAIPlayers(cacheUsersdata);
        
        if(cacheUsersdata!=null){
            var len = this.m_players.length;
            for(var i=0;i < len ;i++){
                var player = this.m_players[i];
                var data = cacheUsersdata[player.getId()];
                if(data == null) continue;
                
                player.syncClientCacheData(data);
            }
            this.m_reconnetenterbattle  = true;
        }else{
            this.m_leftBattleTime = this.m_battleTime;
            this.m_battleBeginTime = DateUtil.getCurrentTimeStamp();
        }

        TimerUtil.frameLoop(1,this,this.onFrameUpdateSpawn);

        return mainRole;
    }

    p.start = function(){
        TimerUtil.loop(CheckEnergyBallTimer,this,this.checkEnergyBall);
        MapMgr.getInstance().setAddBallCallback(this.onAddBallCallback,this);
    }

    p.update = function(){
        var currFrame = TimerUtil.currFrame();
        if((currFrame % 60 == 0))
        {
            this.saveFightData();
        } 
    }

    p.preEnd = function(param){
        this.clearPlayerData();
        TimerUtil.clearAll(this);
    }

    p.end = function(){
        var killNum = this.role.getAvatar().getKillNum();
        var cfgId = this.isGradeMode() ? EGlobalCfg.GradeChipTipsMaxCnt : EGlobalCfg.EndlessChipTipsMaxCnt;
        var cfgMaxNum = DataMgr.getInstance().getGlobalCfg(cfgId);
        var chipCnt = Math.min(killNum,cfgMaxNum);
        GameData.getInstance().user.addSkinChip(chipCnt);

        var newUserFightCnt = parseInt(Laya.LocalStorage.getItem("newUserFightCnt")) || 0
        newUserFightCnt += 1;
        Laya.LocalStorage.setItem("newUserFightCnt",newUserFightCnt);
        Laya.LocalStorage.setItem("dailyReviveCnt",0);
        Laya.LocalStorage.removeItem("videoBuffId");
        this.clearBattleCache();   
    }

    p.exit = function(){
        this.clear();
    }

    p.setGamePause = function(bPause){
        this.m_pause = bPause;
    }

    p.isPause = function(){
        return this.m_pause;
    }

    p.isGradeMode = function(){
        return this.m_gameMode == GameMode.Grade;
    }

    p.isEndlessMode = function(){
        return this.m_gameMode == GameMode.Endless;
    }

    p.calcRank = function(roleId,curRank){
        var len = this.m_players.length;
        
        var temp = null;
        for(var j=0; j<len-1; j++) {
            for(var i = 0; i < len - 1 - j;i++){
                if(this.m_players[i].getScore() < this.m_players[i+1].getScore()){
                    temp = this.m_players[i];
                    this.m_players[i] = this.m_players[i+1];
                    this.m_players[i+1] = temp;
                }
            }
        }

        var rank = len+1;
        for(var i = 0; i < len;i++){
            if(this.m_players[i].getId() == roleId){
                rank = i+1;
                break;
            }
        }
        return rank;
    }
    
    p.getNextGoalTip = function(historyScore,highScore,bMainView){

    }

    p.onFrameUpdateSpawn = function(){
        this.frameInitSpawnBall();
    }

    p.startSpawnEneryBall = function() {
        this.m_initSpawnBall = true;
    }

    p.frameInitSpawnBall = function() {
        if(this.m_initSpawnBall == false)
            return;

        var energyballJson = DataMgr.getInstance().ballCfgData;
        var cfgNergyball = energyballJson[this.m_spawnGroupId];
        if(cfgNergyball == null){
            this.m_initSpawnBall = false;
            this.m_spawnGroupId = 1;
            TimerUtil.clear(this,this.onFrameUpdateSpawn);
            EventMgr.getInstance().event(EEvent.PrepareBattleCompleted);
            return;
        }

        var cnt = cfgNergyball.count;
        var exp = cfgNergyball.exp;
        var poolName = DataMgr.getInstance().getBallPoolSinName(exp);
        var arrBalls = [];
        
        for(var i=0;i<cnt;i++) {
            ball = Pool.getItemByClass(DataMgr.BallActorPoolSign,r2.BallActor);
            ball.setData(poolName,exp,false,false);
            this.m_balls[ball.getId()]=ball;
            ball.setVisible(false);
            arrBalls.push(ball.getAvatar());
        }

        MapMgr.getInstance().insertToQuadTree(arrBalls);

        this.m_spawnGroupId++;
    }

    p.checkEnergyBall = function() {
        this.m_checkSpawnBall = true;
        this.frameCheckSpawnBall();
    }

    var _garbagBall = null;
    var _ballId;
    var _arrBalls = [];

    p.frameCheckSpawnBall = function() {
        if(this.m_checkSpawnBall == false)
            return;

        _arrBalls.length = 0;
        var len = this.m_garbageBalls.length;
        for(var i=0; i<len; i++) {
            _garbagBall = this.m_garbageBalls.pop();
            
            if(_garbagBall == null || _garbagBall.IsFromPlayer()) continue;

            _ballId = _garbagBall.getId();
            _garbagBall.relive(_ballId);
            this.m_balls[_ballId] = _garbagBall;
            _arrBalls.push(_garbagBall.getAvatar());
        }
        if(_arrBalls.length > 0)
            MapMgr.getInstance().insertToQuadTree(_arrBalls);
        if(this.m_garbageBalls.length == 0)
            this.m_checkSpawnBall = false;

        EventMgr.getInstance().event(EEvent.CheckSpawnBallCompleted);
    }

    p.removeBall = function(ballActor){
        var id = ballActor.getId();
        if(ballActor.IsFromPlayer()){
            ballActor.kill();
            Pool.recover(DataMgr.BallActorPoolSignFromPlayer,ballActor);
        }else{
            this.m_garbageBalls.push(ballActor);
        }
        delete this.m_balls[id];
    }

    p.onAddBallCallback = function(ball){
        if(ball == null) return;

        ball.draw();
        this.m_balls[ball.getId()]=ball;
        ball.setVisible(false);
    }

    p.CreateRolePlayer = function(id,name,fromServer){
        this.role = Pool.getItemByClass(DataMgr.PlayerActorPoolSign,r2.PlayerActor);
        this.role.setData(true,id,name,false,false);
        this.role.getAvatar().setGrowProp(GameData.getInstance().user.grow);
        this.role.setMainRole(true);
        this.m_players.push(this.role);
        return this.role;
    }

    p.CreateAIPlayers = function(cacheUsersdata){
        var aiCnt = 29,ainame = ""
        var isNewFight = cacheUsersdata == null;
        for(var i = 0;i < aiCnt;i++){
            var player = Pool.getItemByClass(DataMgr.PlayerActorPoolSign,r2.PlayerActor);
            if(isNewFight)
                ainame = MapMgr.getInstance().getRandomAIName();
            else 
                ainame = cacheUsersdata[""+(i+1)].name;
            player.setData(false,0,ainame,true,false);
            player.setAIAgentId(i,aiCnt);
            this.m_players.push(player);
        }
    }

    p.killAllAIPlayer = function(){
        var len = this.m_players.length;
        for(var i=0; i<len; i++) {
            var player = this.m_players[i];
            if(player != null && !player.isMainRole())
            {
                player.getAvatar().onDead(this.role.getAvatar());
            }
        }
    }

    p.updateAiLevel = function(aiLevel){
        var len = this.m_players.length;
        for(var i=0; i<len; i++) {
            var player = this.m_players[i];
            if(player != null)
            {
                player.setAILevel(aiLevel);
            }
        }
    }

    //保存战斗中的数据
    p.saveFightData = function(){        
        Laya.LocalStorage.removeItem("battleBeginTime");//清除数据
        Laya.LocalStorage.removeItem("usersdata");//清除数据

        Laya.LocalStorage.setItem("battleBeginTime", this.m_battleBeginTime);
        Laya.LocalStorage.setItem("gameMode", this.m_gameMode);

        var usersdata = {};
        var player = null;
        var len = this.m_players.length;
        for(var i =0; i < len;i++){
            player = this.m_players[i];
            var data = {"name":player.getName(),"x":player.x,"y":player.y,"lv":player.getLevel(),"totalEnergy":player.getTotalEnergyPoint(),"curEnergy":player.getEnergyPoint(),
            "score":player.getScore(),"accumScore":player.getAccumScore(),"killNum":player.getKillNum(),"highScore":player.getHighScore()};
            usersdata[player.getId()] = data;
        }
		Laya.LocalStorage.setItem("usersdata", JSON.stringify(usersdata));
    }

    //加载战斗单机数据
    p.readFightData = function(){
        var battleBeginTime = Laya.LocalStorage.getItem("battleBeginTime");

        if(battleBeginTime!=null){
            var passedTime = (DateUtil.getCurrentTimeStamp() - parseInt(battleBeginTime))/1000;
            if(passedTime >= this.m_battleTime || passedTime <= 0){
                this.clearBattleCache();
                return null;        // 战斗结束
            }else
            {
                this.m_battleBeginTime = parseInt(battleBeginTime);
                this.m_leftBattleTime = parseInt(this.m_battleTime - passedTime);
                if(!SDKMgr.IsWebChat()){
                    var usersdata = Laya.LocalStorage.getItem("usersdata");
                    if(usersdata != null && usersdata!="")
                        return JSON.parse(usersdata);
                    else
                        return null;
                }
            }
        }
        return null;
    }

     p.clearBattleCache = function(){
        Laya.LocalStorage.removeItem("battleBeginTime");//清除数据
        Laya.LocalStorage.removeItem("usersdata");//清除数据
    }

    p.clear = function(){
        var ballActor = null;
        for(var i in this.m_balls) {
            ballActor = this.m_balls[i];
            if(ballActor != null)
            {
                ballActor.kill();
                if(ballActor.IsFromPlayer())
                    Pool.recover(DataMgr.BallActorPoolSignFromPlayer,ballActor);
                else
                    Pool.recover(DataMgr.BallActorPoolSign,ballActor);
            }
            delete this.m_balls[i];
        }

        var len = this.m_garbageBalls.length;
        for(var i=0; i<len; i++)
        {
            ballActor = this.m_garbageBalls.pop();
            
            if(ballActor == null) continue;

            ballActor.kill();

            if(ballActor.IsFromPlayer())
                Pool.recover(DataMgr.BallActorPoolSignFromPlayer,ballActor);
            else
                Pool.recover(DataMgr.BallActorPoolSign,ballActor);
        }
    
        var player = null;
        len = this.m_players.length;
        for(var i=0; i<len; i++) {
            player = this.m_players[i];
            if(player != null){
                player.kill(true);
                Pool.recover(DataMgr.PlayerActorPoolSign,player);
            }
        }

        this.m_garbageBalls.length = 0;
        this.m_players.length = 0;   
        Utils.clearDictionary(this.m_balls);
    }

    p.clearPlayerData = function(){
        var len = this.m_players.length;
        for(var i = 0; i < len;i++){
            var player = this.m_players[i];
            if(player!=null)
                player.clear();
        }
    }

    p.checkTask = function(data){

    }

    return Space;
}());