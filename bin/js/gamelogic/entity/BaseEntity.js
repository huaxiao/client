var IActor=new Interface("IActor",["onBorn","onDeath","onRelive","onSyncPosition","onSyncRotation","onSyncScale","onSyncWeapon","onSyncLevel","onSyncExp","onSyncKillNum",
"onSyncKillScore","onStartAttack","onEndAttack","onSyncSpeedup","onSyncInvincible","onSyncHighScore","setKillerSign"]);

 /**
 * 实体基础 提供属性给四叉树使用
 */
var BaseEntity = (function(){
    var BaseEntity = Class();
    var p = BaseEntity.prototype;

    /**
     * Initialization method.
     *
     * @method init
     * @constructor
    **/
    p.ctor = function(){
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.m_collider = new Circle();
        this.m_collider.setTo(this.x,this.y);

        this.m_entityType = 0;
        this.m_id = 0;
        this.m_isDead = false;
        this.m_deadSign = 0;
        this.m_iActor = null;
        this.m_killer = null;
        this.m_visible = true;
    }

    p.clear = function() {
        this.m_isDead = true;
        this.m_deadSign = 1;
        this.m_iActor = null;
        this.m_killer = null;
    }

    p.setVisible = function(vis){
        this.m_visible = vis;
    }

    p.isVisible = function(){
        return this.m_visible;
    }

    //慎用，使用对象池的对象不能调用次方法
    p.destroy = function(){
        for(var key in this)
            delete this[key];
    }

    p.setId = function(id) {
        this.m_id = id;
    }

    p.getId = function(){
        return this.m_id;
    }

    p.setActor = function(iActor){
        if(iActor!=null)
        {
            Interface.ensureImplement(iActor,IActor);
            this.m_iActor = iActor;
        }else
        {
            this.m_iActor = null;
        }
    }

    p.getActor = function(){
        return this.m_iActor;
    }

    p.getEntityType = function(){
        return this.m_entityType;
    }

    p.isPlayer = function(){
        return this.m_entityType == EntityType.Player;
    }

    p.isBall = function(){
        return this.m_entityType == EntityType.EnergyBall;
    }
    
    p.setIsDead = function(isDead){
        this.m_isDead = isDead;
        this.m_deadSign = isDead ? 1 : 0;
        if(this.m_iActor!=null)
        {
            if(this.m_isDead)
                this.m_iActor.onDeath(this.m_killer);
            else
                this.m_iActor.onRelive();
        }
    }

	p.isDead = function(){
        return this.m_isDead;
    }
    
    p.getDeadSign = function() {
        return this.m_deadSign;
    }

    p.setDeadSign = function(deadSign) {
        this.m_deadSign = deadSign;
        this.setIsDead(deadSign == 1);
    }

    p.onBorn = function(){
        if(this.m_iActor!=null)
        {
            this.m_iActor.onBorn();
        }
    }

    p.onDead = function(killer){
        this.m_killer = killer;
        this.setIsDead(true);
    }

    p.onRevive = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onRelive();
    }

    // p.update = function(){

    // }

    p.pos = function(x,y) {
        // if(isNaN(x) || isNaN(y))
        //     console.error('pos x or y isNaN');
            
        // this.x = Math.round(x);
        // this.y = Math.round(y);
        this.x = x;
        this.y = y;
        this.m_collider.setTo(this.x,this.y);
		this.onSyncPosition();
    }

    p.onSyncPosition = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncPosition();
    }

    p.onSyncRotaion = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncRotation();
    }

    p.onSyncScale = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncScale();
    }

    p.onSyncWeapon = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncWeapon();
    }

    p.onSyncLevel = function(oldLv,lv){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncLevel(oldLv,lv);
    }

    p.onSyncExp = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncExp();
    }

    p.onSyncKillNum = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncKillNum();
    }

    p.onSyncKillScore = function(killScore,lastKillNum,curKillNum){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncKillScore(killScore,lastKillNum,curKillNum);
    }

    p.onSyncHighScore = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncHighScore();
    }   

    p.onStartAttack = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onStartAttack();
    }

    p.onEndAttack = function(){
        if(this.m_iActor!=null)
            this.m_iActor.onEndAttack();
    }

    p.onSyncSpeedup = function(inSpeeding){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncSpeedup(inSpeeding);
    }

    p.onSyncInvincible = function(val){
        if(this.m_iActor!=null)
            this.m_iActor.onSyncInvincible(val);
    }

    p.setKillerSign = function(bShow){
        if(this.m_iActor!=null)
            this.m_iActor.setKillerSign(bShow);
    }

    p.getRadius = function(){
        return this.m_collider.getRadius();
    }

    p.setRadius = function(r){
        this.m_collider.setRadius(r);
    }
    
    p.getPoolSignName = function(){
        return null;
    } 

    p.getCollider = function(){
        return this.m_collider;
    }


    p.intersetCircle = function(entity){
        if(entity == null) return false;

        return this.m_collider.intersetCircle(entity.getCollider());
    }

    p.intersetRect = function(entity){
        if(entity == null) return false;

        if(entity.getWeaponRect == null) return false;

        return this.m_collider.intersetRect(entity.getWeaponRect());
    }

    p.intersetWithLine = function(sx,sy,ex,ey){
       return this.m_collider.intersetWithLine(sx,sy,ex,ey);
    }

    return BaseEntity;
})();