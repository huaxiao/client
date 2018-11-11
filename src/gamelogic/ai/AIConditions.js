// var b3 = require('behavior3js');
// var b3 = require('../3rd/behavior3');
// var PlayerStatus = require('../const/PlayerStatus');

/**
 * AI Conditions
 */

/**
 * 是否可以攻击
 */
(function(){
    var IsCanAttack = b3.Class(b3.Condition);
    var p = IsCanAttack.prototype;
    p.name = "IsCanAttack";

    p.tick = function(tick){
        if(tick.wrapper.isCanAttack()) {
             return b3.SUCCESS;
        }
        else {
           return b3.FAILURE; 
        }
    }

    b3.IsCanAttack = IsCanAttack;
})();

/**
 * 是否视野范围内有怪物
 */
(function(){
    var IsEnemyInView = b3.Class(b3.Condition);
    var p = IsEnemyInView.prototype;
    p.name = "IsEnemyInView";

    p.tick = function(tick){
        if(tick.wrapper.isEnemyInView()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsEnemyInView = IsEnemyInView;
})();

/**
 * 是否视野范围内有能量球
 */
(function(){
    var IsEnergyballInView = b3.Class(b3.Condition);
    var p = IsEnergyballInView.prototype;
    p.name = "IsEnergyballInView";

    p.tick = function(tick){
        if(tick.wrapper.isEnergyBallInView()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsEnergyballInView = IsEnergyballInView;
})();

/**
 * 是否攻击范围内有怪物
 */
(function(){
    var IsEnemyInAttack = b3.Class(b3.Condition);
    var p = IsEnemyInAttack.prototype;
    p.name = "IsEnemyInAttack";

    p.tick = function(tick){
        if(tick.wrapper.isEnemyInAttack()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsEnemyInAttack = IsEnemyInAttack;
})();

/**
 * 是否攻击角度内有怪物
 */
(function(){
    var IsEnemyInAttackAngle = b3.Class(b3.Condition);
    var p = IsEnemyInAttackAngle.prototype;
    p.name = "IsEnemyInAttackAngle";

    p.tick = function(tick){
        if(tick.wrapper.isEnemyInAttackAngle()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsEnemyInAttackAngle = IsEnemyInAttackAngle;
})();

/**
 * 是否目标点可到达
 */
(function(){
    var IsCanMoveToPos = b3.Class(b3.Condition);
    var p = IsCanMoveToPos.prototype;
    p.name = "IsCanMoveToPos";

    p.tick = function(tick){
        if(tick.wrapper.isCanMoveToPos()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsCanMoveToPos = IsCanMoveToPos;
})();


/**
 * 是否到达目标
 */
(function(){
    var IsReachTarget = b3.Class(b3.Condition);
    var p = IsReachTarget.prototype;
    p.name = "IsReachTarget";

    p.tick = function(tick){
        if(tick.wrapper.isReachTarget()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsReachTarget = IsReachTarget;
    
})();

/**
 * 判断选中目标类型
 */
(function(){
    var IsSelectTargetType = b3.Class(b3.Condition);
    var p = IsSelectTargetType.prototype;
    p.name = "IsSelectTargetType";

    p.parameters = {'targetType': 0};
    p.__Condition_initialize = p.initialize;
    p.initialize = function(settings) {
        settings = settings || {};
        this.__Condition_initialize();
        this.targetType = settings.targetType || 0; 
    }

    p.tick = function(tick){
        if(tick.wrapper.isSelectTargetType(this.targetType)) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsSelectTargetType = IsSelectTargetType;
})();


/**
 * 判断选中的目标是否离开视野
 */
(function(){
    var IsTargetOutView = b3.Class(b3.Condition);
    var p = IsTargetOutView.prototype;
    p.name = "IsTargetOutView";

    p.tick = function(tick){
        if(tick.wrapper.isTargetOutView()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsTargetOutView = IsTargetOutView;
})();


/**
 * 是否视野范围内有单位
 */
var IsEntityInView=(function(){
    var IsEntityInView = b3.Class(b3.Condition);
    var p = IsEntityInView.prototype;
    p.name = "IsEntityInView";

    p.tick = function(tick){
        if(tick.wrapper.isEntityInView()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsEntityInView = IsEntityInView;
})();


/**
 * 是否攻击状态
 */
(function(){
    var IsAttacking = b3.Class(b3.Condition);
    var p = IsAttacking.prototype;
    p.name = "IsAttacking";

    p.tick = function(tick){
        if(tick.wrapper.isAttacking()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsAttacking = IsAttacking;
})();

/**
 * 是否移动状态 
 */
(function(){
    var IsMoving = b3.Class(b3.Condition);
    var p = IsMoving.prototype;
    p.name = "IsMoving";

    p.tick = function(tick){
        if(tick.wrapper.isMoving()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsMoving = IsMoving;
})();

/**
 * 是否追击范围内有怪物 
 */
(function(){
    var HasTargetsInChaseRange = b3.Class(b3.Condition);
    var p = HasTargetsInChaseRange.prototype;
    p.name = "HasTargetsInChaseRange";

    p.tick = function(tick){
        if(tick.wrapper.isEnemyInChaseRange()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.HasTargetsInChaseRange = HasTargetsInChaseRange;
})();

/**
 * 是否是活的
 */
(function(){
    var IsLive = b3.Class(b3.Condition);
    var p = IsLive.prototype;
    p.name = "IsLive";

    p.tick = function(tick){
        if(tick.wrapper.isDead()) {
            return b3.FAILURE;
        }
        else {
            return b3.SUCCESS;
        }
    }

    b3.IsLive = IsLive;
})();


/**
 * 目标是否还在追击范围里面
 */
(function(){
    var IsTargetInChase = b3.Class(b3.Condition);
    var p = IsTargetInChase.prototype;
    p.name = "IsTargetInChase";

    p.tick = function(tick){
        if(tick.wrapper.isTargetInChaseRange()) {
            return b3.FAILURE;
        }
        else {
            return b3.SUCCESS;
        }
    }

    b3.IsTargetInChase = IsTargetInChase;
})();

/**
 * 是否死亡状态
 */
(function(){
    var IsDead = b3.Class(b3.Condition);
    var p = IsDead.prototype;
    p.name = "IsDead";

    p.tick = function(tick){
        if(tick.wrapper.isDead()) {
            return b3.SUCCESS;
        }
        else {
            return b3.FAILURE;
        }
    }

    b3.IsDead = IsDead;
})();