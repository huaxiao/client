/**
 * DialogView 
 */

var DialogView=(function(_super){
	function DialogView(msg,callback){
		DialogView.__super.call(this);
		this.content.text = msg;
		this.closeBtn.on(Laya.Event.CLICK,this,this.onCloseBtnClick);
		this.m_callback = callback;
	}

	Laya.class(DialogView,'view.DialogView',_super);
	var p = DialogView.prototype;

	p.onCloseBtnClick = function() {
		SoundMgr.getInstance().playUIClick();

		if(this.m_callback != null) {
			this.m_callback();
		}
        this.close();
	}

	/**
     * 卸载界面
     */
    p.uninit = function(){

    }

	return DialogView;
})(DialogViewUI)