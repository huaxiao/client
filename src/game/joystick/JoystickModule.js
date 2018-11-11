/*
* JoystickModule 遥感控制模块
*/
var JoystickModule = (function (_super) {

    function JoystickModule(joystickview,joystickbtn,joystickthumb,joysticktouch,joystickcenter) {
        JoystickModule.__super.call(this);
        this._view = joystickview;
        this._button = joystickbtn;
        this._button.changeStateOnClick = false;
        this._thumb = joystickthumb;
        this._touchArea = joysticktouch;
        this._center = joystickcenter;
        this._InitX = this._center.x + this._center.width / 2;
        this._InitY = this._center.y + this._center.height / 2;
        this.touchId = -1;
        this.radius = 100;
        this._curPos = new laya.maths.Point();
        this._touchArea.on(laya.events.Event.MOUSE_DOWN, this, this.onTouchDown);
        this._touchArea.on(laya.events.Event.MOUSE_OUT, this, this.OnMouseOut);
    }

    Laya.class(JoystickModule,"JoystickModule",_super);
    var p = JoystickModule.prototype;

    p.Trigger = function (evt) {
        this.onTouchDown(evt);
    };

    /**
     * 按下
     */
    p.onTouchDown = function (evt) {
        if (this.touchId == -1) {
            this.touchId = evt.touchId;
            if (this._tweener != null) {
                this._tweener.clear();
                this._tweener = null;
            }
            
            //fairygui.GRoot.inst.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, this._curPos);
            // this._view.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, this._curPos);
            var bx = Laya.stage.mouseX;
            var by = Laya.stage.mouseY;
            //console.log("bx=",bx,"by=",by);

            this._button.selected = true;
            if (bx < this._touchArea.x)
                bx = this._touchArea.x;
            else if (bx > this._touchArea.width)
                bx = this._touchArea.width;
            if (by >  Laya.stage.height)
                by = Laya.stage.height;
            else if (by < this._touchArea.y)
                by = this._touchArea.y;
            this._lastStageX = bx;
            this._lastStageY = by;
            this._startStageX = bx;
            this._startStageY = by;
            this._center.visible = true;
            this._center.x = bx - this._center.width / 2;
            this._center.y = by - this._center.height / 2;
            this._button.x = bx - this._button.width / 2;
            this._button.y = by - this._button.height / 2;
            var deltaX = bx - this._InitX;
            var deltaY = by - this._InitY;
			
            var degrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            this._thumb.rotation = degrees + 90;

            Laya.stage.on(laya.events.Event.MOUSE_MOVE, this, this.OnTouchMove);
            Laya.stage.on(laya.events.Event.MOUSE_UP, this, this.OnTouchUp);
            Laya.stage.on(laya.events.Event.MOUSE_OUT,this,this.OnMouseOut);
        }
    };

    /**
     * 抬起
     */
    p.OnTouchUp = function (evt) {
        if (this.touchId != -1 && evt.touchId == this.touchId) {
            this.resetJoystick();
        }
    };

    /**
     * 移动
     */
    p.OnTouchMove = function (evt) {
        if (this.touchId != -1 && evt.touchId == this.touchId) {
            var bx = Laya.stage.mouseX;
            var by = Laya.stage.mouseY;
            var moveX = bx - this._lastStageX;
            var moveY = by - this._lastStageY;
            this._lastStageX = bx;
            this._lastStageY = by;
            var buttonX = this._button.x + moveX;
            var buttonY = this._button.y + moveY;
            var offsetX = buttonX + this._button.width / 2 - this._startStageX;
            var offsetY = buttonY + this._button.height / 2 - this._startStageY;
            var rad = Math.atan2(offsetY, offsetX);
            var degree = rad * 180 / Math.PI;
            this._thumb.rotation = degree + 90;
            var maxX = this.radius * Math.cos(rad);
            var maxY = this.radius * Math.sin(rad);
            if (Math.abs(offsetX) > Math.abs(maxX))
                offsetX = maxX;
            if (Math.abs(offsetY) > Math.abs(maxY))
                offsetY = maxY;
            buttonX = this._startStageX + offsetX;
            buttonY = this._startStageY + offsetY;
            if (buttonX < 0)
                buttonX = 0;
            if (buttonY > Laya.stage.height)
                buttonY = Laya.stage.height;
            this._button.x = buttonX - this._button.width / 2;
            this._button.y = buttonY - this._button.height / 2;
            this.event(JoystickModule.JoystickMoving, degree);
        }
    };

    p.OnMouseOut = function(evt){
        if (this.touchId != -1 && evt.touchId == this.touchId) {
            this.resetJoystick();
        }
    }

    p.resetJoystick = function(){
        this.touchId = -1;
        this._thumb.rotation = this._thumb.rotation + 180;
        this._center.visible = false;
        this._tweener = laya.utils.Tween.to(this._button, { x: this._InitX - this._button.width / 2, y: this._InitY - this._button.height / 2 }, 300, laya.utils.Ease.circOut, laya.utils.Handler.create(this, function () {
            this._tweener = null;
            this._button.selected = false;
            this._thumb.rotation = 0;
            this._center.visible = true;
            this._center.x = this._InitX - this._center.width / 2;
            this._center.y = this._InitY - this._center.height / 2;
        }));
        Laya.stage.off(laya.events.Event.MOUSE_MOVE, this, this.OnTouchMove);
        Laya.stage.off(laya.events.Event.MOUSE_UP, this, this.OnTouchUp);
        Laya.stage.off(laya.events.Event.MOUSE_OUT,this,this.OnMouseOut);
        this.event(JoystickModule.JoystickUp);
    }

    p.clear = function(){
        Laya.stage.off(laya.events.Event.MOUSE_MOVE, this, this.OnTouchMove);
        Laya.stage.off(laya.events.Event.MOUSE_UP, this, this.OnTouchUp);
        Laya.stage.off(laya.events.Event.MOUSE_OUT,this,this.OnMouseOut);
        this._touchArea.off(laya.events.Event.MOUSE_DOWN, this, this.onTouchDown);
        this._touchArea.off(laya.events.Event.MOUSE_OUT, this, this.OnMouseOut);
    }
    

    JoystickModule.JoystickMoving = "JoystickMoving";
    JoystickModule.JoystickUp = "JoystickUp";

    return JoystickModule;
}(laya.events.EventDispatcher));