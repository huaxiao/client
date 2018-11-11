/**
 * EnergyBall 能量球
 */

var EnergyBall = (function(){

    var EnergyBall = Class(BaseEntity);
    var p = EnergyBall.prototype;
    var _initRadius = 25;
    p.__BaseEntity_ctor = p.ctor;
    p.__BaseEntity_setIsDead = p.setIsDead;
    p.__BaseEntity_onDead = p.onDead;
    p.__BaseEntity_clear = p.clear;
    p.__BaseEntity_setRadius = p.setRadius;
    
    p.ctor = function() {
        this.__BaseEntity_ctor();
        
        this.m_entityType = EntityType.EnergyBall;
        this.m_energyPoint = 0;
        this.m_poolSignName = null;
        this.m_fromPlayer = false;      //是否从玩家身上掉落的
        this.m_cellRow = -1;
        this.m_cellCol = -1;
        this._mapMgr = null;
    }

    p.clear = function() {
        this.__BaseEntity_clear();
        this.m_fromPlayer = false;      //是否从玩家身上掉落的
        this.m_ballCfgId = 0;
        this.m_cellRow = -1;
        this.m_cellCol = -1;
        // this.m_energyPoint = 0;不要清理，从对象池里重用需要使用
        // _mapMgr = null;
        Utils.clearDictionary(this.m_syncData);
    }

    p.born = function(){
       this.onBorn();  //同步出生信息
       this.setIsDead(false);
    }

    p.IsFromPlayer = function(){
        return this.m_fromPlayer;
    }

    p.setFromPlayer = function(fromPlayer){
        this.m_fromPlayer = fromPlayer;
    }

    p.initMapMgr = function(mapMgr){
        this._mapMgr = mapMgr;
    }

    p.setMapCell = function(row,col){
        this.m_cellRow = row;
        this.m_cellCol = col;
    }

    p.getCellRow = function(){
        return this.m_cellRow;
    }

    p.getCellCol = function(){
        return this.m_cellCol;
    }

    p.setData = function(energyPoint) {
        if(energyPoint == 0){
            // console.warn('ball energy',energyPoint)
        }
        this.m_energyPoint = energyPoint;
        var map = this._mapMgr.m_curMap;
        if(!this.IsFromPlayer()){
            var radius = DataMgr.getInstance().getBallRadius(energyPoint);
            this.setRadius(radius);
            map.addBallToCell(this);
        }

        this.m_isDead = false;
        this.m_deadSign = 0;
        this.m_isDead = false;
    }

    p.setIsDead = function(isDead) {
        this.__BaseEntity_setIsDead(isDead);
    }

    p.getEnergyPoint = function(){
        return this.m_energyPoint;
    }

    p.setPoolSignName = function(poolName) {
        this.m_poolSignName = poolName;
    }

    p.getPoolSignName = function(){
		return this.m_poolSignName;
	}

    p.getAvatar = function() {
        return this;//兼容前后端对象
    }

    p.onDead = function(killer){
        this.__BaseEntity_onDead(killer);
        this._mapMgr.removeBall(this);
    }

    p.setRadius = function(radius){
        this.__BaseEntity_setRadius(radius);
        this.width=this.height=radius*2;	
    }

    p.setBallCfgId = function(id) {
        this.m_ballCfgId = id;
    }

    /** Server Sync */
    p.getSyncData = function() {
        var data = this.m_syncData;
        if(data == null) {
            data = {};
            this.m_syncData = data;
        }
        data.x = this.x;
        data.y = this.y;
        data.id = this.m_id;
        data.energy = this.m_energyPoint;
        if(this.m_fromPlayer) {
            data.ballCfgId = this.m_ballCfgId;
            data.radius = this.getRadius();
        }
        return data;
    }

    return EnergyBall;
})();