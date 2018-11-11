/**
 * AI Actions
 */

/**
 * 攻击
 */
(function(){
    var Attack = b3.Class(b3.Action);
    var p = Attack.prototype;
    p.name = "Attack";

    var isAttack = false;

    p.tick = function(tick){
        if(isAttack) {
            if(tick.wrapper.isAttacking()){
                return b3.RUNNING;
            }
            else {
                return b3.SUCCESS;
            }
        }        

        tick.target.attack();
        isAttack = true;
        
        return b3.RUNNING;
    }

    p.exit = function(tick){
        isAttack = false;
    }

    b3.Attack = Attack;
})();

/**
 * 转身
 */
(function(){
    var Rotate = b3.Class(b3.Action);
    var p = Rotate.prototype;
    p.name = "Rotate";

    p.tick = function(tick){
        var attackTarget = tick.target.m_aiAgent.m_attackTarget;
        if(attackTarget != null && !attackTarget.isDead()) { 
             tick.target.rotateToPos(attackTarget.x,attackTarget.y);
        }
        
        return b3.SUCCESS;
    }

    b3.Rotate = Rotate;
})();

/**
 * 移动
 */
(function(){
    var Move = b3.Class(b3.Action);
    var p = Move.prototype;
    p.name = "Move";

    p.parameters = {'moveType': 0};
    p.__Action_initialize = p.initialize;
    p.initialize = function(settings) {
        settings = settings || {};
        this.__Action_initialize();
        this.moveType = settings.moveType || 0;
        this.targetType = settings.targetType || 0; 
    }

    p.tick = function(tick){
        tick.wrapper.moveTo();
        return b3.SUCCESS;
    }

    b3.Move = Move;
})();

/**
 * 选择目标
 */
(function(){
    var SetTarget = b3.Class(b3.Action);
    var p = SetTarget.prototype;
    p.name = "SetTarget";

    p.parameters = {'sortType': 0,'entityType':0};
    p.__Action_initialize = p.initialize;
    p.initialize = function(settings) {
        settings = settings || {};
        this.__Action_initialize();
        this.sortType = settings.sortType || 0;
        this.entityType = settings.entityType || 0;
    }

    p.tick = function(tick){
        tick.wrapper.selectTarget(this.sortType,this.entityType);
        return b3.SUCCESS;
    }

    b3.SetTarget = SetTarget;
})();

/**
 * 清理选中目标
 */
(function(){
    var ClearTarget = b3.Class(b3.Action);
    var p = ClearTarget.prototype;
    p.name = "ClearTarget";

    p.tick = function(tick){
        tick.wrapper.clearSelectTarget();
        return b3.SUCCESS;
    }

    b3.ClearTarget = ClearTarget;
})();

/**
 * 吃豆
 */
(function(){
    var EatBalls = b3.Class(b3.Action);
    var p = EatBalls.prototype;
    p.name = "EatBalls";

    p.tick = function(tick){
        tick.wrapper.eatBalls();
        return b3.SUCCESS;
    }


    b3.EatBalls = EatBalls;
})();