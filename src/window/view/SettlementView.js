/**
 * SettlementView 结算界面
*/
var SettlementView=(function(_super){
	function SettlementView(){
		SettlementView.__super.call(this);
	}

	Laya.class(SettlementView,'view.SettlementView',_super);

	var p = SettlementView.prototype;

	p.init = function(data){
		this.m_canClose = false;
		this.m_data = data;
		this.mouseLayer.on(Laya.Event.CLICK,this,this.onClose);
		this.shareBtn.on(Laya.Event.CLICK,this,this.onShare);
		SoundMgr.getInstance().stopMusic();
		SoundMgr.getInstance().playSound(ESound.Settlement);
		this.nextLabel.visible = false;
		TimerUtil.once(1000,this,this.showNext);
		this.refreshView();
	}

	p.uninit = function(){
		this.mouseLayer.off(Laya.Event.CLICK,this,this.onClose);
		this.shareBtn.off(Laya.Event.CLICK,this,this.onShare);
	}

	p.showNext = function(){
		this.m_canClose = true;
		this.nextLabel.visible = true;
	}

	p.onClose = function() {
		if(!this.m_canClose) return;
        SoundMgr.getInstance().playUIClick();

		UIMgr.getInstance().toUI(EUI.OfflineSettlementView,this.m_data);
    }

	p.onShare = function(){
		CheckIPMgr.getInstance().showVideoOrShare(ShareVideoPos.GradeSettleShare1);
	}

	p.refreshView = function(){
		// var user = GameData.getInstance().user;
        // var grade = user.grade;
        // var starCnt = user.getGradeStar();
		var beginGradeData = GameMgr.getInstance().m_space.m_gradeData;
		var grade = beginGradeData.grade;
		var starCnt = beginGradeData.gradeStar;
		var cfg = DataMgr.getInstance().getUserGradeCfg(grade);
		if(cfg == null) return;
		this.gradeLabel.text = cfg.name;
        this.gradeIcon.skin = cfg.bigicon;
		this.lvIcon.skin = cfg.gradeicon;
		
		var taskResult = TaskMgr.getInstance().getResult();
        if(grade == DataMgr.getInstance().getMaxUserGrade()) {
            this.starBox.visible = false;
            this.maxGradeBox.visible = true;
			if(taskResult == 1)
				starCnt += 1;
            this.starCnt.text ="x"+starCnt;
        }
        else {
            this.maxGradeBox.visible = false;
            this.starBox.visible = true;
            for(var i=0; i<3; i++) {
                this['star'+i].skin = i < starCnt ? "common/star1.png" : "common/star0.png";
            }
        }
		this.msgLabel.visible = taskResult == 0;
		this.flagBox.visible = grade >= 10;

		var arrTask = TaskMgr.getInstance().getTaskArray();
        var task,dom,done;
        for(var i=0; i<3; i++) {
            task = arrTask[i];
            dom = this.taskBox.getChildByName("task"+i);
			done = this.taskBox.getChildByName("done"+i);
            if(task != null) {
                dom.visible = true;
				done.visible = task.finish == 1;
                dom.innerHTML = task.settleStyle;
            }
            else {
                dom.visible = false;
				done.visible = false;
            }
        }

		if(taskResult == 1) {
			var nextStar = starCnt + 1;
			var ani = this["ani"+nextStar];
			if(ani != null)
				ani.play(0,false);
			if(nextStar == 4) {
				this.flyStar.visible = false;
				TimerUtil.once(1000,this,function(){
					for(var i=0; i<3; i++) {
						this['star'+i].skin = "common/star0.png";
					}
					var cfg = DataMgr.getInstance().getUserGradeCfg(grade+1);
					if(cfg != null){
						this.gradeLabel.text = cfg.name;
						this.gradeIcon.skin = cfg.bigicon;
						this.lvIcon.skin = cfg.gradeicon;
					}
				});
			}
		}
		else {
			this.flyStar.visible = false;
		}
	}

	return SettlementView;
})(SettlementViewUI)