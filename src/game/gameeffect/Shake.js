/*
* name;
*/
var Shake = (function () {
    var ShakeOffset = 12;
    var ShakeSpeed = 32;
    var ShakeTimes = 2;

    function Shake() {
        this.m_isShake = false;
        this.m_shakeNum = 0;
        this.m_shakeOffsetArr = [0,0];
        this.m_shakePoint = new Point(0,0);
        this.m_node = null;
    }

    Shake.inst = function(){
        if(Shake._instance == null){
            Shake._instance = new Shake();
        }
        return Shake._instance;
    }

    var p = Shake.prototype;
    p.isShaking = function(){
        return this.m_isShake;
    }

    p.stageShake = function(node){
        if(this.m_isShake) return;

        this.m_isShake = true;

        this.m_node = node;
        this.m_shakeNum = 0;
        this.m_shakeOffsetArr[0] = 0;
        this.m_shakeOffsetArr[1] = 0;
        this.m_shakePoint.setTo(this.m_node.x,this.m_node.y);
        Laya.stage.timerLoop(ShakeSpeed, this, this.shake);

    }

    p.shake = function(args,frameNum,frameTime){
         var count = (this.m_shakeNum++) % 4;

         this.m_shakeOffsetArr[this.m_shakeNum % 2] = count < 2 ? 0 : ShakeOffset;
         this.m_node.x = this.m_shakeOffsetArr[0] + this.m_shakePoint.x;
         this.m_node.y = this.m_shakeOffsetArr[1] + this.m_shakePoint.y;

         if(this.m_shakeNum > (ShakeTimes * 4 + 1)){
            Laya.stage.clearTimer(this, this.shake);
            this.m_shakeNum = 0;
            this.m_isShake = false;
         }
    }
    
    p.stopShake = function(){
        if(this.m_isShake){
            Laya.stage.clearTimer(this, this.shake);
            this.m_shakeNum = 0;
            this.m_isShake = false;
        }
    }

    return Shake;
}());
Shake._instance = null;

var ShakeInst = (function () {
    function ShakeInst() {
    }

    ShakeInst.isShaking = function(){
        return Shake.inst().isShaking();
    }

    ShakeInst.stageShake = function(node){
        Shake.inst().stageShake(node);
    }    

    ShakeInst.stopShake = function(){
        Shake.inst().stopShake();
    }   
    return ShakeInst;
}());