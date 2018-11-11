var AIAgentObject = (function () {
    function AIAgentObject(player) {
        this.player = player;
        this.m_viewRange = 0;
        this.m_chaseRange = 0;
        this.m_attackRange = 0;
        this.m_attackAngle = 180;
        this.m_skillCDTime = 1;
    }

    var p = AIAgentObject.prototype;

    p.setAIDiff = function(aiDiff){
        if(aiDiff!=null){
            this.m_viewRange = aiDiff.viewRange;
            this.m_chaseRange = aiDiff.chaseRange;
            this.m_attackRange = aiDiff.attackRange;
            this.m_attackAngle = aiDiff.attackAngle;
            this.m_skillCDTime = aiDiff.skillCDTime;
        }
    }

    p.aiAgent = function(){
        return this.player.m_aiAgent;
    }

    p.findPlayersInView = function(){
        this.aiAgent().clearPlayerTargets();

        var players = MapMgr.getInstance().m_arrPlayer;
        var playerCnt = players.length;
        var px = this.player.x;
        var py = this.player.y;

        var player = null;

        for(var i=0; i<playerCnt; i++) {
            player = players[i];

            if(player == null || player.isDead() || player == this.player) continue;

            if(!Utils.validPos(px,py,player.x,player.y,600,600)) continue;

            if(this.checkEntityInView(player)) {
                this.aiAgent().addViewPlayer(player);
            }
        }
    }

    p.findBallsInView = function(){
        this.aiAgent().clearBallTargets();

        var balls = MapMgr.getInstance().m_quadTree.retrieve(this.player);
        var ballsCnt = balls.length;
        var px = this.player.x;
        var py = this.player.y;
        var ball = null;

        for(var j=0; j<ballsCnt; j++) {
            ball = balls[j];
            if(ball == null || ball.isDead()) continue;

            if(!Utils.validPos(px,py,ball.x,ball.y,350,350)) continue;

            if(this.checkEntityInView(ball)) {
                this.aiAgent().addViewBall(ball);
            }
        }
    }

    p.isEntityInView = function(){
        return this.isEnemyInView() || this.isEnergyBallInView();
    }

    p.checkEntityInView = function(entity) {
        var px = this.player.x;
        var py = this.player.y;
        return Utils.isCircleCollision(px,py,this.m_viewRange,entity.x,entity.y,entity.getRadius());
    }

    p.isEnemyInView = function(){
        this.findPlayersInView();

        return this.aiAgent().m_playersInView.length > 0;
    }

    p.isEnergyBallInView = function(){
        this.findBallsInView();

        return this.aiAgent().m_ballsInView.length > 0;
    }

    p.isEnemyInChaseRange = function(){
        var arrTargets = this.aiAgent().m_playersInView;
        var cnt = arrTargets.length;
        var px = this.player.x;
        var py = this.player.y;
        var target = null;

        for(var i=0; i<cnt; i++) {
            target = arrTargets[i];
            if(Utils.isCircleCollision(px,py,this.m_chaseRange,target.x,target.y,target.getRadius()))
            {
                return true;
            }
        }
        return false;
    }

    p.isEnemyInAttack = function(){
        var arrTargets = this.aiAgent().m_playersInView;
        var cnt = arrTargets.length;
        var px = this.player.x;
        var py = this.player.y;
        var target = null;

        for(var i=0; i<cnt; i++) {
            target = arrTargets[i];
            if(Utils.isCircleCollision(px,py,this.m_attackRange,target.x,target.y,target.getRadius()))
            {
                return true;
            }
        }
        return false;
    }

    p.isEnemyInAttackAngle = function(){
        var arrTargets = this.aiAgent().m_playersInView;
        var cnt = arrTargets.length;
        var px = this.player.x;
        var py = this.player.y;
        var playerCfg = this.player.getCfg();
        var modelRotate = this.player.getModelRotate();

        var target = null;
        var angle = 0;
        var minAngle = 0;
        var maxAngle = 0;

        for(var i=0; i<cnt; i++) {
            target = arrTargets[i];
            angle = Utils.getAngle(px,py,target.x,target.y);  //修改为角度值
            minAngle = -90 + modelRotate;
            maxAngle = this.m_attackAngle - 90 + modelRotate;
            if(angle > minAngle && angle < maxAngle){
                return true;
            }
        }
        return false;
    }

    p.isCanMoveToPos = function(){
        var x = this.player.m_nexPos.x;
        var y = this.player.m_nexPos.y;
        var canMove = this.player.m_moveBounds.contains(x,y);
        return canMove;
    }

    p.selectTarget = function(sortType,entityType){
        this.player.setTarget(this.aiAgent().selectTarget(sortType,entityType));
    }

    p.isReachTarget = function(){
        var target = this.player.getTarget();
        if(target == null) return false;

        return Utils.isCircleCollision(this.player.x,this.player.y,this.player.getRadius(),target.x,target.y,target.getRadius());
    }

    p.isTargetInChaseRange = function(){
        var target = this.player.getTarget();
        if(target == null) return false;

        return Utils.isCircleCollision(this.player.x,this.player.y,this.m_chaseRange,target.x,target.y,target.getRadius());
    }

    p.isSelectTargetType = function(targetType){
        var target = this.player.getTarget();
        if(target == null) return false;

        if(target.isDead())
        {
            this.player.setTarget(null);
            return false;
        }

        var ret =  target.getEntityType() == targetType;
        if(ret){
            this.aiAgent().lockTarget(target);
        }

        return ret;
    }

    p.isTargetOutView = function(){
        var target = this.player.getTarget();

        if(target == null) return true;

        if(target.isDead()) return true;

        var dist = Utils.getDistance(this.player.x,this.player.y,target.x,target.y);

        return dist > this.player.getCfg().viewR;
    }

    p.clearSelectTarget = function(){
        this.player.setTarget(null);
        this.aiAgent().clearTarget();
    }

    p.inSkillCDTime = function(){
        return (TimerUtil.currTimer() - this.player.m_lastCastSkillTime) < this.m_skillCDTime; 
    }

    p.isCanAttack = function(){
        return !this.isAttacking() && !this.inSkillCDTime();
    }

    p.isAttacking = function(){
        return this.player.getStatus() == PlayerStatus.Attack;
    }

    p.isDead = function(){
        return this.player.isDead();
    }

    p.isMoving = function(){
        return this.player.getStatus() == PlayerStatus.Move
    }

    p.eatBalls = function(){
        if(this.isDead()) return;

        MapMgr.getInstance().checkBallCollision(this.player);
        this.clearSelectTarget();
    }

    p.moveTo = function(){
        if(this.isDead()) return;

        if(this.player.onMove()){

            var deltaX = this.player.m_nexPos.x - this.player.x;
            var deltaY = this.player.m_nexPos.y - this.player.y;
            // 
            if(this.player.isAIEdge() && (deltaX == 0 || deltaY == 0) && Math.abs(this.player.getModelRotate()%90) != 0 )
                this.player.setModelRatation(Math.random() * 360);
        }
    }

    return AIAgentObject;
}());