var PlayerPoolSign = "Player";
var CheckCollisionFrameInterval = 6; 
var UpdateRankFrameInterval = 30;

/*
* 地图管理器
*/
var MapMgr = (function () {
    function MapMgr() {
        this.ctor();
    }

     /**
     * 单例模式
     */
    MapMgr.getInstance = function () {
        if (MapMgr._instance == null) {
            MapMgr._instance = new MapMgr();
        }
        return MapMgr._instance;
    };

    var p = MapMgr.prototype;

    p.ctor = function() {
        this.m_arrPlayer = [];
        this.m_ballsLink = new DoubleLink();
        this.m_curMap = null;
        this.m_quadTree = null;
        this.m_ballIdSpawn = 0;
        this.m_playerIdSpawn = 0;
        this.m_removeBallCallback = null;
        this.m_removeBallCaller = null;
        this.m_addBallCallback = null;
        this.m_addBallCaller = null;
        this.m_deathStatusCallback = null;
        this.m_deathStatusCaller = null;
        this.m_modelRotCallback = null;
        this.m_modelRotCaller = null;
        this.m_weaponRotCallback = null;
        this.m_weaponRotCaller = null;

        this.m_tempQueue = new Queue();
        this.m_usedAINames = {};
    }

    p.clear = function(){
        var player;
        for(var i=this.m_arrPlayer.length-1; i>=0; i--) {
            player = this.m_arrPlayer[i];
            this.removePlayer(player);
        }
        this.m_arrPlayer.length = 0;

        for (var iter = this.m_ballsLink.getHead(); !this.m_ballsLink.isEnd(iter); iter = this.m_ballsLink.next(iter)) {
            if(iter == null)
                break;

            this.removeBall(iter.getData());
        }
        this.m_ballsLink.clear();

        this.m_ballIdSpawn = 0;
        this.m_playerIdSpawn = 0;
        this.m_addBallCallback = null;
        this.m_addBallCaller = null;
        
        Utils.clearDictionary(this.m_usedAINames);

        this.m_curMap.clear();
        this.m_quadTree.clear();
        this.m_kdaSta.clear();
        this.m_tempQueue.clear();
    }

    p.buildMap = function(){
        if(this.m_curMap == null)
            this.m_curMap = new GameMap();
        
        if(this.m_quadTree == null)
            this.m_quadTree = new Quadtree(this.m_curMap.getBounds());

        if(this.m_kdaSta == null)
            this.m_kdaSta = new PlayerKDAStat();
    }

    p.getMap = function(){
        return this.m_curMap;
    }

    p.setBroadcastMsgCallback = function(callback, caller){
        this.m_kdaSta.setBroadcastMsgCallback(callback, caller);
    }

    p.setRemoveBallCallback = function(callback,caller) {
        this.m_removeBallCallback = callback;
        this.m_removeBallCaller = caller;
    }

    p.setAddBallCallback = function(callback,caller){
        this.m_addBallCallback = callback;
        this.m_addBallCaller = caller;
    }

    p.setDeathStatusCallback = function(callback,caller){
        this.m_deathStatusCallback = callback;
        this.m_deathStatusCaller = caller;
    }

    p.syncDeathStatus = function(playerId,isDead,killerId){
        if(this.m_deathStatusCallback != null) {
            this.m_deathStatusCallback.call(this.m_deathStatusCaller,playerId,isDead,killerId)
        }
    }

    p.setModelRotCallback = function(callback,caller){
        this.m_modelRotCallback = callback;
        this.m_modelRotCaller = caller;
    }

    p.syncModelRot = function(playerId,rot){
        if(this.m_modelRotCallback != null) {
            this.m_modelRotCallback.call(this.m_modelRotCaller,playerId,rot)
        }
    }

    p.setWeaponRotCallback = function(callback,caller){
        this.m_weaponRotCallback = callback;
        this.m_weaponRotCaller = caller;
    }

    p.syncWeaponRot = function(playerId,rot){
        if(this.m_weaponRotCallback != null) {
            this.m_weaponRotCallback.call(this.m_weaponRotCaller,playerId,rot)
        }
    }

    p.getPlayerCount = function() {
        return this.m_arrPlayer.length;
    }

    p.addPlayer = function(iActor,id){
        var player = ObjectPoolUtil.getEntityFromPool(PlayerPoolSign,EntityType.Player);  
        if(id > 0)
        {
            player.setId(id);
        }  
        else
        {
            player.setId(++this.m_playerIdSpawn);
        }
        
        player.setActor(iActor);
        player.initMapMgr(this);
        this.m_kdaSta.addPlayerKDA(player.getId());
        this.m_arrPlayer.push(player); 
        return player;
    }

    p.removePlayer = function(player){
        if(player == null) return;

        ObjectPoolUtil.recoverEntityToPool(PlayerPoolSign,player);
        var index = this.m_arrPlayer.indexOf(player);
        if(index >= 0 && index < this.m_arrPlayer.length)
            this.m_arrPlayer[index] = null;

        player.clear();
    }

    p.addBall = function(poolName,exp,iActor,fromPlayer){
        var ball = ObjectPoolUtil.getEntityFromPool(poolName,EntityType.EnergyBall);
        ball.setId(this.m_ballIdSpawn++);
        ball.setFromPlayer(fromPlayer);
        ball.setActor(iActor);
        ball.initMapMgr(this);
        ball.setData(exp);
        ball.m_doubleLinkNode = ball.m_doubleLinkNode || new DoubleLinkNode(ball);
        this.m_ballsLink.pushBack(ball.m_doubleLinkNode);
        return ball;
    }

    p.reuseBall = function(id,poolName,exp,iActor){
        // if(this.m_arrBall[id] != null)
        //     console.error('reuseBall same id',id);

        var ball = ObjectPoolUtil.getEntityFromPool(poolName,EntityType.EnergyBall);
        ball.setId(id);
        ball.initMapMgr(this);
        ball.setActor(iActor);
        ball.setData(exp);
        ball.m_doubleLinkNode = ball.m_doubleLinkNode || new DoubleLinkNode(ball);
        this.m_ballsLink.pushBack(ball.m_doubleLinkNode);
        return ball;
    }

    p.removeBall = function(ball){
        if(ball == null) return;

        if(this.m_removeBallCallback != null) {
            this.m_removeBallCallback.call(this.m_removeBallCaller,ball)
        }

        this.m_curMap.removeBallFromCell(ball);
        this.m_quadTree.removeObject(ball);
        ObjectPoolUtil.recoverEntityToPool(ball.getPoolSignName(),ball);
        
        ball.m_doubleLinkNode.detach();
        // this.m_arrBall[ball.getId()] = null;

        ball.clear();
    }

    p.update = function(){
        var player;
        for (var i=this.m_arrPlayer.length-1; i>=0; i--) {
            this.m_arrPlayer[i].update();
        }

        var curFrame = TimerUtil.currFrame();

        if(curFrame % 4 == 0) {
            this.updateMapCell();
        }

        // if(curFrame % CheckCollisionFrameInterval == 0) {
        //     this.checkCollision();
        // }

        if(curFrame % UpdateRankFrameInterval == 0){
            this.sortByScore();
        }
    }

    // //四叉树更新 只对球 太耗禁止调用
    // p.updateQuadTree = function() {
    //     this.m_quadTree.clear();
    //     this.m_quadTree.insert(this.m_arrBall);
    // }

    p.insertToQuadTree = function(objs) {
        this.m_quadTree.insert(objs);
    }

    p.checkCollision = function() {
        var player,balls;

        for (var i=this.m_arrPlayer.length-1; i>=0; i--) {
            player = this.m_arrPlayer[i];
            if(player == null || player.isDead()) continue;

            balls = this.m_quadTree.retrieve(player);
            if(balls!=null)
            {
                for(var j=balls.length-1; j>=0; j--) {
                    var ball = balls[j];
                    if(ball.isDead()) continue;
                    
                    if(Utils.validPos(player.x,player.y,ball.x,ball.y,350,350))
                        player.onCollision(ball);
                }
            }
        }
    }


    p.checkBallCollision = function(player){
        var balls = this.m_quadTree.retrieve(player);
        if(balls!=null)
        {
            for(var j=balls.length-1; j>=0; j--) {
                var ball = balls[j];
                if(ball.isDead()) continue;
                
                if(Utils.validPos(player.x,player.y,ball.x,ball.y,350,350))
                    player.onCollision(ball);
            }
        }
    }

    p.checkAttackCollision = function(player) {
        if(player.getStatus() != PlayerStatus.Attack) return;  //非攻击状态不进行武器和玩家的碰撞检测

        var target = null;
        for(var j=this.m_arrPlayer.length-1; j>=0; j--) {
            target = this.m_arrPlayer[j];
            
            if(target == null || target.isDead() || target == player || !target.isVisible()) continue;

            if(player.onCollision(target)){
                this.refreshPlayerKillInfo(player,target);
            }
        }
    }

    p.checkHitPlayer = function(player){
        this.checkAttackCollision(player);
    }

    p.refreshPlayerKillInfo = function(attacker,target){
        //复仇
        if(attacker.getLastAttackId() == target.getId())
            target.setKillerSign(false);

        this.m_kdaSta.refreshPlayerKillInfo(attacker,target);
    }

    p.refreshAccumScore = function(player){
        this.m_kdaSta.refreshAccumScore(player);
    }

    ///生成战斗结算数据
    p.getBattleSettlementData = function(){
        this.sortByHighScore();
        this.sortByAccumScore();
        this.sortByScore();
        this.sortByKillNum();
    }

    ///根据最高分排序
    p.sortByHighScore = function(){
        var len = this.m_arrPlayer.length;
        
        var temp = null;
        for(var j=0; j<len-1; j++) {
            for(var i = 0; i < len - 1 - j;i++){
                if(this.m_arrPlayer[i].getHighScore() < this.m_arrPlayer[i+1].getHighScore()){
                    temp = this.m_arrPlayer[i];
                    this.m_arrPlayer[i] = this.m_arrPlayer[i+1];
                    this.m_arrPlayer[i+1] = temp;
                }
            }
        }

        for(var i = 0; i < len; i++){
            this.m_arrPlayer[i].setHighScoreRank(i+1);
        }
    }

    ///根据累计积分进行排序
    p.sortByAccumScore = function(){
        var len = this.m_arrPlayer.length;
        
        var temp = null;
        for(var j=0; j<len-1; j++) {
            for(var i = 0; i < len - 1 - j;i++){
                if(this.m_arrPlayer[i].getAccumScore() < this.m_arrPlayer[i+1].getAccumScore()){
                    temp = this.m_arrPlayer[i];
                    this.m_arrPlayer[i] = this.m_arrPlayer[i+1];
                    this.m_arrPlayer[i+1] = temp;
                }
            }
        }

        for(var i = 0; i < len; i++){
            this.m_arrPlayer[i].setAccumScoreRank(i+1);
        }
    }

    //根据积分进行排序
    p.sortByScore = function(){
        var len = this.m_arrPlayer.length;
        
        var temp = null;
        for(var j=0; j<len-1; j++) {
            for(var i = 0; i < len - 1 - j;i++){
                if(this.m_arrPlayer[i].getScore() < this.m_arrPlayer[i+1].getScore()){
                    temp = this.m_arrPlayer[i];
                    this.m_arrPlayer[i] = this.m_arrPlayer[i+1];
                    this.m_arrPlayer[i+1] = temp;
                }
            }
        }

        for(var i = 0; i < len; i++){
            this.m_arrPlayer[i].setScoreRank(i+1);
        }
    }

    p.sortByKillNum = function(){
        var len = this.m_arrPlayer.length;
        
        var temp = null;
        for(var j=0; j<len-1; j++) {
            for(var i = 0; i < len - 1 - j;i++){
                if(this.m_arrPlayer[i].getKillNum() < this.m_arrPlayer[i+1].getKillNum()){
                    temp = this.m_arrPlayer[i];
                    this.m_arrPlayer[i] = this.m_arrPlayer[i+1];
                    this.m_arrPlayer[i+1] = temp;
                }
            }
        }

        for(var i = 0; i < len; i++){
            this.m_arrPlayer[i].setKillRank(i+1);
        }
    }

    /**
     * score: 玩家当前积分
     * x1,y1: 攻击者位置
     * x2,y2: 死亡玩家位置
     */
    p.generateKillBall = function(score,x1,y1,x2,y2,r){
        var totalScore = score * DataMgr.getInstance().getGlobalCfg(EGlobalCfg.KillRewardFactor) + DataMgr.getInstance().getGlobalCfg(EGlobalCfg.KillRewardFixedScore);
        var cfg = DataMgr.getInstance().getKillballCfg(totalScore);
        if(cfg == null) return null;

        var count = (Math.random() * (cfg.maxCount - cfg.minCount)) + cfg.minCount;
        var ballScore = Math.round(totalScore/count);

        var radius = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.KillDropRadius);
        var isEdge = this.m_curMap.isAIEdge(x2,y2,r);
        if(isEdge)
            radius = r;

        var angle = DataMgr.getInstance().getGlobalCfg(EGlobalCfg.KillDropAngle);
        var startAngle = Utils.getAngle(x1,y1,x2,y2);
        var mapBounds = this.m_curMap.m_aibounds;
        var ballRadius = cfg.radius;
        var poolName = DataMgr.EnergyBallPoolSignFromPlayer;
        var ball = null;
        var arrBalls = [];
        var cosVal = 0,sinVal = 0;

        for(var i =0; i < count; i++){
            ball = ObjectPoolUtil.generateBall(this,poolName,ballScore,true,false);
            if(ball.IsFromPlayer()){
                ball.setBallCfgId(cfg.id);
                var alpha = Math.random() * angle + startAngle;
                var distance = radius;
                
                cosVal = Utils.getCos(alpha);
                sinVal = Utils.getSin(alpha);

                var x = x2 + distance * cosVal;
                var y = y2 + distance * sinVal;
                if(x-ballRadius <= mapBounds.x){
                    x = mapBounds.x+ballRadius;
                }else  if(x + ballRadius >= mapBounds.width){
                    x = mapBounds.width - ballRadius;
                }

                if(y -ballRadius <= mapBounds.y){
                    y = mapBounds.y+ballRadius;
                }else  if(y + ballRadius >= mapBounds.height){
                    y = mapBounds.height - ballRadius;
                } 
            
                ball.pos(x,y);
                ball.setRadius(ballRadius);
                if(this.m_addBallCallback != null) {
                    this.m_addBallCallback.call(this.m_addBallCaller,ball)
                }
            }
            arrBalls.push(ball.getAvatar());
        }

        if(arrBalls.length > 0)
            this.insertToQuadTree(arrBalls);
    }

    p.getMapCell = function(x,y){
        return this.m_curMap.getCellByPos(x,y);
    }

    p.updateMapCell = function(){
        this.m_curMap.resetMapCellPlayerRecord();

        var player;
        for (var i=this.m_arrPlayer.length-1; i>=0; i--) {
            player = this.m_arrPlayer[i];
            if(player == null || player.isDead()) continue;

            player.syncMapCell(true);
        }
    }

    p.getRandomAIName = function(){
        var dataMgr = DataMgr.getInstance();
        var cnt = dataMgr.getAINameCount()-1;
        var name,randomIndex;
        while(true) {
            randomIndex = Math.round(Math.random()*cnt);
            name = dataMgr.getAINameByIndex(randomIndex);
            if(this.m_usedAINames[name] == null) {
                break;
            }
        }
        this.m_usedAINames[name] = name;
        return name;
    }

    p.generateLine = function(){
        return ObjectPoolUtil.getItemByClass("Line",Line);
    }

    p.recoverLine = function(line){
        ObjectPoolUtil.recoverEntityToPool("Line",line);
    }

    return MapMgr;
}());

MapMgr._instance = null;