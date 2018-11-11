/*
* 对象池工具;
*/
var ObjectPoolUtil = (function () {
    function ObjectPoolUtil() {        
    }
    
    ObjectPoolUtil.generateBall = function(mapMgr,poolName,exp,fromPlayer,fromServer){
        var entity = null;
        if(GameConst.Server){
            entity = mapMgr.addBall(poolName,exp,null,fromPlayer);
            entity.setIsDead(false);
        }else{
            entity = Pool.getItemByClass(DataMgr.BallActorPoolSignFromPlayer,r2.BallActor);
            entity.setData(poolName,exp,false,true);
        }

        return entity;
    }

    ObjectPoolUtil.getEntityFromPool = function(sign, type){
        var entity = null;
        if(GameConst.Server){
            if(type == EntityType.EnergyBall)
                entity = ObjectPool.getItemByClass(sign,EnergyBall);
            else if(type == EntityType.Player)
                entity = ObjectPool.getItemByClass(sign,Player);   
        }else{
            if(type == EntityType.EnergyBall)
                entity = Pool.getItemByClass(sign,EnergyBall);
            else if(type == EntityType.Player)
                entity = Pool.getItemByClass(sign,Player);                
        }
        
        entity.setIsDead(false);
        if(entity.setPoolSignName!=null)
            entity.setPoolSignName(sign);

        return entity;
    }

    ObjectPoolUtil.getItemByClass = function(sign,cls){
        if(GameConst.Server){
            return ObjectPool.getItemByClass(sign,cls);
        }else{  
            return Pool.getItemByClass(sign,cls);           
        }
    }

    ObjectPoolUtil.recoverEntityToPool = function(sign,obj){
        if(GameConst.Server){
            ObjectPool.recover(sign,obj);
        }else{
           Pool.recover(sign,obj);
        }
    }

    return ObjectPoolUtil;
})();