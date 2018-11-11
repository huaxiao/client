/*
* 商店;
*/
var ShopView = (function (_super) {
    function ShopView() {
        ShopView.__super.call(this);
    }

    Laya.class(ShopView,'view.ShopView',_super);
    var p = ShopView.prototype;

    var SHOPID = 1;

    p.init = function() {
        this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);
        this.addBtn.on(Laya.Event.CLICK,this,this.onAddCnt);
        this.buyBtn.on(Laya.Event.CLICK,this,this.onBuy);
        this.cntTxt.on(Laya.Event.INPUT,this,this.refresh);

        EventMgr.getInstance().on(EEvent.Player_Goods_Update,this,this.refresh);
        
        this.m_cnt = 0;
        this.onAddCnt();
    }

    /**
     * 卸载界面
     */
    p.uninit = function(){
        EventMgr.getInstance().off(EEvent.Player_Goods_Update,this,this.refresh);
    }

    p.onClose = function(){
        UIMgr.getInstance().closeUI(EUI.ShopView);
    }

    p.onAddCnt = function(){
        this.m_cnt ++;
        this.cntTxt.text = ""+this.m_cnt;

        this.refresh();
    }

    p.refresh = function(){
        this.m_cnt = parseInt(this.cntTxt.text) || 0;
        this.cntTxt.text = ""+this.m_cnt;
        var shopCfg = DataMgr.getInstance().getShopCfg(SHOPID);
        var prize = shopCfg&&shopCfg.prize || 0;
        var needGold = prize * this.m_cnt;
        var gold = GameData.getInstance().goods.gold;
        this.m_canBuy = needGold <= gold;
        this.buyBtn.labelColors = this.m_canBuy ? "#ffffff" : "#ff0000";
        this.buyBtn.label = needGold + ""; 
    }

    p.onBuy = function(){
        if(!this.m_canBuy) {
            UIMgr.getInstance().showTips("金币不足",600,24,"#000000");
        }
        else {
            if(this.m_cnt < 1) {
                UIMgr.getInstance().showTips("数量不正确",600,24,"#000000");
            }
            else {
                ServerAgency.getInstance().sendShopBuy(SHOPID,this.m_cnt);
            }
        }
        this.onClose();
    }

    return ShopView;
}(ShopViewUI));