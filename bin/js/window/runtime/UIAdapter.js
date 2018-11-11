/*
* UI 适配脚本，直接设runtime为UIAdapter;
*/
var UIAdapter = (function (_super) {
    function UIAdapter() {
        UIAdapter.super(this);
        
        this.uiname = null;
        Laya.timer.once(20,this,this.adapter);//延迟才能取到值
    }

    Laya.class(UIAdapter,"UIAdapter",_super);

    var p = UIAdapter.prototype;

    p.adapter = function() {
        var designRatio = Laya.stage.designWidth / Laya.stage.designHeight;
        var ratio = Laya.stage.width / Laya.stage.height;

        if(this.name == "rightTop") {
            if(!Utils.onMobile()) {
                this.top = 0;
                return;
            }
            
            this.top = Utils.clamp(120 - 10 * (designRatio - ratio)*100,100,120);
        }else if(this.name == "scale"){
            var wRatio = Laya.stage.width / Laya.stage.designWidth;
            var hRatio = Laya.stage.height / Laya.stage.designHeight;
            var scale = wRatio > hRatio?wRatio:hRatio;
            this.scaleX = scale;
            this.scaleY = scale;
            this.uiname = this.parent.uiname;
            UIMgr.getInstance().addAdapter(this);
            return;
        }

        if(ratio < 2) {
            return;
        }

        //认为是有刘海的长屏幕,需要把点击控件放安全区
        var safeOffX = 132 / 2436 * Laya.stage.width;
                    
        if(!isNaN(this.left)) {
            this.left = safeOffX + this.left;
        }
        else if(!isNaN(this.right)) {
            this.right = safeOffX + this.right;
        }
    }
    
    return UIAdapter;
}(Laya.Box));