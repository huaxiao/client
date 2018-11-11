var TargetSortType = {
    MinDistance : 0,
}
    
var AIAgent = (function(){

    function AIAgent() {
       this.reset();
    }

    var p = AIAgent.prototype;
    
    p.reset = function() {
        this.m_btree = null;
        this.m_blackboard = null;
        this.m_target = null;

        this.m_ballsInView = null;
        this.m_playersInView = null;
        this.m_attackTarget = null;
        this.m_ballsFromScene = [];
        this.m_ballsFromPlayer = [];
    }

    p.startAI = function(player,ainame) {
        this.m_target = player;
        this.m_ballsInView = [];
        this.m_playersInView = [];
        this.m_isRunning = true;
        this.m_btree = new b3.BehaviorTree();
        var json = DataMgr.getInstance().getAIJson(ainame);
        this.m_btree.load(json);

        this.m_blackboard = new b3.Blackboard();
    }

    p.stopAI = function() {
        this.m_isRunning = false;
    }

    p.setIsRunning = function(isRunning) {
        this.m_isRunning = isRunning;
    }

    p.switchRunning = function() {
        this.m_isRunning = !this.m_isRunning;
        return this.m_isRunning;
    }

    p.isRunning = function() {
        return this.m_isRunning;
    }

    p.update = function() {
        if(this.m_isRunning && this.m_btree != null) {
            this.m_btree.tick(this.m_target,this.m_blackboard);
        }
    }

    p.clearPlayerTargets = function(){
        this.m_playersInView.length = 0;
    }

    p.clearBallTargets = function(){
        this.m_ballsInView.length = 0;
    }

    p.clearViewTargets = function() {
        this.m_ballsInView.length = 0;
        this.m_playersInView.length = 0;
        this.m_attackTarget = null;
    }

    p.addViewBall = function(target) {
        this.m_ballsInView.push(target);
    }

    p.addViewPlayer = function(target){
        this.m_playersInView.push(target);
    }

    p.selectTarget = function(sortType,entityType){
        var minDistance = Number.MAX_VALUE;
        var target = null;
        if(entityType == EntityType.Player){
            var len = this.m_playersInView.length;
            for(var i=0; i<len; i++) {
                target = this.m_playersInView[i];
                if(sortType == TargetSortType.MinDistance) {
                    var dis = Utils.getDistanceSqr(this.m_target.x,this.m_target.y,target.x,target.y);
                    if(dis < minDistance) {
                        this.m_attackTarget = target;
                        minDistance = dis;
                    }
                }
            }
        }else if(entityType == EntityType.EnergyBall){
            var len = this.m_ballsInView.length;
            this.m_ballsFromScene.length = 0;
            this.m_ballsFromPlayer.length = 0;

            for(var i=0; i<len; i++) {
                target = this.m_ballsInView[i];
                if(target.IsFromPlayer()){
                    this.m_ballsFromPlayer.push(target);
                }else{
                    this.m_ballsFromScene.push(target);
                }
            }
            if(this.m_ballsFromPlayer.length > 0){
                if(this.m_attackTarget != null && !this.m_attackTarget.isDead() && this.m_attackTarget.isBall()  && this.m_attackTarget.IsFromPlayer())
                    return this.m_attackTarget;

                len = this.m_ballsFromPlayer.length;
                for(var i=0; i<len; i++) {
                    target = this.m_ballsFromPlayer[i];
                    if(sortType == TargetSortType.MinDistance) {
                        var dis = Utils.getDistanceSqr(this.m_target.x,this.m_target.y,target.x,target.y);
                        if(dis < minDistance) {
                            this.m_attackTarget = target;
                            minDistance = dis;
                        }
                    }
                }
            }else{
                if(this.m_attackTarget != null && !this.m_attackTarget.isDead() && this.m_attackTarget.isBall())
                    return this.m_attackTarget;

                len = this.m_ballsFromScene.length;
                for(var i=0; i<len; i++) {
                    target = this.m_ballsFromScene[i];
                    if(sortType == TargetSortType.MinDistance) {
                        var dis = Utils.getDistanceSqr(this.m_target.x,this.m_target.y,target.x,target.y);
                        if(dis < minDistance) {
                            this.m_attackTarget = target;
                            minDistance = dis;
                        }
                    }
                }
            }
        }else if(entityType == EntityType.All){
            var len = this.m_playersInView.length;
            for(var i=0; i<len; i++) {
                target = this.m_playersInView[i];
                if(sortType == TargetSortType.MinDistance) {
                    var dis = Utils.getDistanceSqr(this.m_target.x,this.m_target.y,target.x,target.y);
                    if(dis < minDistance) {
                        this.m_attackTarget = target;
                        minDistance = dis;
                    }
                }
            }

            len = this.m_ballsInView.length;
            for(var i=0; i<len; i++) {
                target = this.m_ballsInView[i];
                if(sortType == TargetSortType.MinDistance) {
                    var dis = Utils.getDistanceSqr(this.m_target.x,this.m_target.y,target.x,target.y);
                    if(dis < minDistance) {
                        this.m_attackTarget = target;
                        minDistance = dis;
                    }
                }
            }
        }
        return this.m_attackTarget;
    }

    p.lockTarget = function(target){
        this.m_attackTarget = target;
    }

    p.clearTarget = function(){
        this.m_attackTarget = null;
    }

    return AIAgent;
})();