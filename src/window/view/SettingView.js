/**
 * SettingView 设置界面
*/
var SettingView=(function(_super){
	function SettingView(){
		SettingView.__super.call(this);
	}

	Laya.class(SettingView,'view.SettingView',_super);

	var p = SettingView.prototype;

	p.init = function(){
		this.closeBtn.on(Laya.Event.CLICK,this,this.onClose);
		this.soundSlider.max = this.musicSlider.max = 100;
		this.soundSlider.min = this.musicSlider.min = 0;		

		this.musicSlider.value = SoundMgr.getInstance().getMusicVolume() * 100;
		this.soundSlider.value = SoundMgr.getInstance().getSoundVolume() * 100;

		this.lastMusicOff = this.musicSlider.value == 0;
		
		this.musicSlider.on(laya.events.Event.CHANGE,this,this.onChangeMusicSlider);
		this.soundSlider.on(laya.events.Event.CHANGE,this,this.onChangeSoundSlider);

		this.music.on(Laya.Event.CLICK,this,this.switchMusic);
		this.musicoff.on(Laya.Event.CLICK,this,this.switchMusic);
		this.sound.on(Laya.Event.CLICK,this,this.switchSound);
		this.soundoff.on(Laya.Event.CLICK,this,this.switchSound);

		this.onChangeMusicSlider();
		this.onChangeSoundSlider();
    }

	p.onChangeMusicSlider = function(){
		// console.log('this.musicSlider.value',this.musicSlider.value)
		var isOff = this.musicSlider.value == 0;
		SoundMgr.getInstance().setMusicMute(isOff);
		if(this.lastMusicOff && !isOff) {
			SoundMgr.getInstance().playBattleBgm();
			this.lastMusicOff = isOff;
		}
		this.music.visible = !isOff;
		this.musicoff.visible = isOff;
		SoundMgr.getInstance().setMusicVolume(this.musicSlider.value / 100);
	}

	p.onChangeSoundSlider = function(){
		// console.log('this.soundSlider.value',this.soundSlider.value)
		var isOff = this.soundSlider.value == 0;
		SoundMgr.getInstance().setSoundMute(isOff);
		this.sound.visible = !isOff;
		this.soundoff.visible = isOff;
		SoundMgr.getInstance().setSoundVolume(this.soundSlider.value / 100);
	}

    p.onClose = function() {
        SoundMgr.getInstance().playUIClick();

        UIMgr.getInstance().closeUI(EUI.SettingView);
    }

	p.switchMusic = function() {
		if(this.music.visible) {
			this.music.visible = false;
			this.musicoff.visible = true;
			this.musicSlider.value = 0;
		}
		else {
			this.music.visible = true;
			this.musicoff.visible = false;
			this.musicSlider.value = 100;
		}
		this.onChangeMusicSlider();
	}

	p.switchSound = function() {
		if(this.sound.visible) {
			this.sound.visible = false;
			this.soundoff.visible = true;
			this.soundSlider.value = 0;
		}
		else {
			this.sound.visible = true;
			this.soundoff.visible = false;
			this.soundSlider.value = 100;
		}
		this.onChangeSoundSlider();
	}

	return SettingView;
})(SettingViewUI)