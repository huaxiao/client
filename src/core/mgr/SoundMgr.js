/*
* 声音管理器
*/
var SoundMgr = (function () {
    function SoundMgr() {
        this.init();
        EventMgr.getInstance().on(EEvent.GetFocus,this,this.onGetFocus);
        this.m_curBgmName = null;
    }

    SoundMgr.getInstance = function () {
        if (SoundMgr._instance == null) {
            SoundMgr._instance = new SoundMgr();
        }
        return SoundMgr._instance;
    };

    var p = SoundMgr.prototype;

    p.init = function(){
        Laya.SoundManager.autoStopMusic = true;//切后台关闭背景音乐

        var saveMusicVolume = Laya.LocalStorage.getItem("musicVolume");
        var musicVolume = 1;
        if(saveMusicVolume!=null && saveMusicVolume!="")
            musicVolume = parseFloat(saveMusicVolume);
		this.setMusicVolume(musicVolume);
        this.setMusicMute(musicVolume==0);

        var saveSoundVolume = Laya.LocalStorage.getItem("soundVolume");
        var soundVolume = 1;
        if(saveSoundVolume!=null && saveSoundVolume!="")
            soundVolume = parseFloat(saveSoundVolume);
		this.setSoundVolume(soundVolume);
        this.setSoundMute(soundVolume==0);
    }

    p.onGetFocus = function(){
        if(this.m_curBgmName == null) return;

        Laya.SoundManager.playMusic(this.m_curBgmName);
    }

    p.playBgm = function(){
        this.m_curBgmName = ESound.Bgm;
        Laya.SoundManager.playMusic(ESound.Bgm);
    }

    p.playBattleBgm = function(){
        this.m_curBgmName = ESound.BattleBgm;
        Laya.SoundManager.playMusic(ESound.BattleBgm);
    }

    p.stopMusic = function(){
        Laya.SoundManager.stopMusic();
    }

    p.playUIClick = function(){
        this.playSound(ESound.UIClick);
    }

    p.playSound = function(soundName){
        if(!GameConst.SupportOpenDomain) return;
        
        Laya.SoundManager.playSound(soundName);
    }

    p.setMusicMute = function(mute){
        Laya.SoundManager.musicMuted = mute;
    }

    p.isMusicMuted = function(){
        return Laya.SoundManager.musicMuted;
    }

    p.setMusicVolume = function(volume){
        Laya.SoundManager.setMusicVolume(volume);
        Laya.LocalStorage.setItem("musicVolume", volume);
    }

    p.getMusicVolume = function(){
        return Laya.SoundManager.musicVolume;
    }

    p.setSoundMute = function(mute){
        Laya.SoundManager.soundMuted = mute;
    }

    p.isSoundMuted = function(){
        return Laya.SoundManager.soundMuted;
    }

    p.setSoundVolume = function(volume){
        Laya.SoundManager.setSoundVolume(volume);   
        Laya.LocalStorage.setItem("soundVolume", volume);
    }

    p.getSoundVolume = function(){
        return Laya.SoundManager.soundVolume;
    }



    return SoundMgr;
}());

SoundMgr._instance = null;