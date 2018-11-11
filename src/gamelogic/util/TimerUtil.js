/*
*定时器工具;
*/
var TimerUtil = (function () {
    function TimerUtil() {
        
    }

    if(GameConst.Server){
        var Timer = require('../../base/Timer');
        TimerUtil.m_timer = new Timer();
    }

    /** 当前帧开始的时间。*/
    TimerUtil.currTimer = function(){
        if(GameConst.Server){
            return TimerUtil.m_timer._now();
        }else{
            return Laya.timer.currTimer;
        }
    }

    /** 时针缩放。*/
    TimerUtil.scale = function(){
        if(GameConst.Server){
            return TimerUtil.m_timer.scale;
        }else{
            return Laya.timer.scale;
        }
    }

    /** 当前的帧数。*/
    TimerUtil.currFrame = function(){
        if(GameConst.Server){
            return TimerUtil.m_timer.currFrame;
        }else{
            return Laya.timer.currFrame;
        }
    }

    /**
     *两帧之间的时间间隔,单位毫秒。
     */
    TimerUtil.delta = function(){
        if(GameConst.Server){
            return TimerUtil.m_timer._delta;
        }else{
            return Laya.timer.delta;
        }
    }

    /**
     * 定时执行一次。
     * @param	delay	延迟时间(单位为毫秒)。
     * @param	caller	执行域(this)。
     * @param	method	定时器回调函数。
     * @param	args	回调参数。
     * @param	coverBefore	是否覆盖之前的延迟执行，默认为 true 。
     */
    TimerUtil.once = function(delay, caller, method, args, coverBefore){
        if(GameConst.Server){
            TimerUtil.m_timer.once(delay,caller,method,args,coverBefore);
        }else{
            Laya.timer.once(delay,caller,method,args,coverBefore);
        }
    }

    /**
     * 定时重复执行。
     * @param	delay	间隔时间(单位毫秒)。
     * @param	caller	执行域(this)。
     * @param	method	定时器回调函数。
     * @param	args	回调参数。
     * @param	coverBefore	是否覆盖之前的延迟执行，默认为 true 。
     * @param	jumpFrame 时钟是否跳帧。基于时间的循环回调，单位时间间隔内，如能执行多次回调，出于性能考虑，引擎默认只执行一次，设置jumpFrame=true后，则回调会连续执行多次
     */
    TimerUtil.loop = function(delay, caller, method, args, coverBefore, jumpFrame){
        if(GameConst.Server){
            TimerUtil.m_timer.loop(delay,caller,method,args,coverBefore,jumpFrame);
        }else{
            Laya.timer.loop(delay,caller,method,args,coverBefore,jumpFrame);
        }
    }

    /**
     * 定时执行一次(基于帧率)。
     * @param	delay	延迟几帧(单位为帧)。
     * @param	caller	执行域(this)。
     * @param	method	定时器回调函数。
     * @param	args	回调参数。
     * @param	coverBefore	是否覆盖之前的延迟执行，默认为 true 。
     */
    TimerUtil.frameOnce = function(delay, caller, method, args, coverBefore){
        if(GameConst.Server){
            TimerUtil.m_timer.frameOnce(delay,caller,method,args,coverBefore);
        }else{
            Laya.timer.frameOnce(delay,caller,method,args,coverBefore);
        }
    }

    /**
     * 定时重复执行(基于帧率)。
     * @param	delay	间隔几帧(单位为帧)。
     * @param	caller	执行域(this)。
     * @param	method	定时器回调函数。
     * @param	args	回调参数。
     * @param	coverBefore	是否覆盖之前的延迟执行，默认为 true 。
     */
    TimerUtil.frameLoop = function(delay, caller, method, args, coverBefore){
        if(GameConst.Server){
            TimerUtil.m_timer.frameLoop(delay,caller, method, args, coverBefore);
        }else{
            Laya.timer.frameLoop(delay,caller, method, args, coverBefore);
        }
    }

    /**
     * 清理定时器。
     * @param	caller 执行域(this)。
     * @param	method 定时器回调函数。
     */
    TimerUtil.clear = function(caller, method){
        if(GameConst.Server){
            TimerUtil.m_timer.clear(caller,method);
        }else{
            Laya.timer.clear(caller,method);
        }
    }

    /**
     * 清理对象身上的所有定时器。
     * @param	caller 执行域(this)。
     */
    TimerUtil.clearAll = function(caller){
        if(GameConst.Server){
            TimerUtil.m_timer.clearAll(caller);
        }else{
            Laya.timer.clearAll(caller);
        }
    }

    /**
     * 延迟执行。
     * @param	caller 执行域(this)。
     * @param	method 定时器回调函数。
     * @param	args 回调参数。
     */
    TimerUtil.callLater = function(caller, method, args){
        if(GameConst.Server){
            TimerUtil.m_timer.callLater(caller,method,args);
        }else{
            Laya.timer.callLater(caller,method,args);
        }
    }

    /**
     * 立即执行 callLater 。
     * @param	caller 执行域(this)。
     * @param	method 定时器回调函数。
     */
    TimerUtil.runCallLater = function(caller,method){
        if(GameConst.Server){
            TimerUtil.m_timer.runCallLater(caller,method);
        }else{
            Laya.timer.runCallLater(caller,method);
        }
    }

    /**
     * 立即提前执行定时器，执行之后从队列中删除
     * @param	caller 执行域(this)。
     * @param	method 定时器回调函数。
     */
    TimerUtil.runTimer = function(caller,method){
        if(GameConst.Server){
            TimerUtil.m_timer.runTimer(caller,method);
        }else{
            Laya.timer.runTimer(caller,method);
        }
    }

    return TimerUtil;
})();