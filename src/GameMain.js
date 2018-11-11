var Loader = laya.net.Loader;
var Handler = laya.utils.Handler;
var WebGL = laya.webgl.WebGL;

var fetchGameConstSuccess = false;
var windowWidth = 0;
var windowHeight = 0;
var registerTime = 0;	//玩家注册时间
var accountTime = 0;	

// 程序入口
var GameMain = (function(){
	function GameMain() {
		//初始化微信小游戏
		if(SDKMgr.IsWebChat()){
			Laya.MiniAdpter.init();
			if(typeof(wx) != "undefined"){
				Laya.MiniAdpter.window.wx.onShow(onShowWX);
				Laya.MiniAdpter.window.wx.onHide(onHideWX);
				wx.getNetworkType({
					success:onNetworkStatusChange
				});
				wx.onNetworkStatusChange(onNetworkStatusChange);
			}
		}

		//游戏入口
		Laya.init(1280, 720, WebGL);//IE不支持WebGL,表现简直渣渣
		Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_HEIGHT;
		Laya.stage.screenMode = Laya.Stage.SCREEN_HORIZONTAL;
		Laya.stage.frameRate = Laya.Stage.FRAME_FAST;
        Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
        Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
		Laya.stage.bgColor = "#1F1932";

		/**
		 * 初始化时可以操作广点通（微信广告）位置及大小 宽度最小值为300，高度不能设置  会根据宽度自动调整
		 * gdt_left : 0, gdt_bottom : 0, gdt_top : 20 gdt_right : 20  gdt_widht : 350
		*/
		if(typeof(wx) != "undefined"){
			var sysInfo = wx.getSystemInfoSync();
			windowWidth = sysInfo.windowWidth;
			windowHeight = sysInfo.windowHeight;

			console.log("windowWidth:"+windowWidth+" windowHeight:"+windowHeight);

			var sdkVersion = sysInfo.SDKVersion;
			if(compareVersion(sdkVersion,"2.0.1")==-1){
				GameConst.SupportOpenDomain = false;
			}

			window.AladinSDK = aladinSDK.AladinSDK; 
			AladinSDK.init('wx3ac7faa4e813826e','1.4.0',{gdt_left : 0, gdt_bottom : 0, gdt_top : 20,gdt_right : 20,gdt_widht : 350},initAladinSDKCallback);
		}else{
			GameConst.SupportOpenDomain = false;
		}

		//激活资源版本控制
		Laya.ResourceVersion.enable("version.json", Handler.create(null, start), Laya.ResourceVersion.FILENAME_VERSION);

		registerTime = Laya.LocalStorage.getItem("wxRegisterTime");
		if(registerTime == null || registerTime ==''){
			registerTime = Date.now();
			Laya.LocalStorage.setItem("wxRegisterTime",registerTime);
			Laya.LocalStorage.removeItem("canFetchVideo");
			Laya.LocalStorage.removeItem("useVideoMaxTime");
		}	
		console.log("wxRegisterTime:"+registerTime);
		accountTime = Date.now() - registerTime;
		if(accountTime >= 4 * 24 * 60*60 *1000)
		{
			GameData.getInstance().user.olderPlayer = true;
		}else{
			GameData.getInstance().user.olderPlayer = false;
		}

		if(GameConst.GM){
			Laya.Stat.show();
		}
	};

	function start()	{
		loadRemoteGameConst();
		UIMgr.getInstance().toUI(EUI.Loading);
		
		ServerAgency.getInstance().registerOnce();
		var serverIndex = 0;
		NetMgr.getInstance().selectServer(ENetList[serverIndex]);
		SDKMgr.getInst().sdkLogin(function(params){
			SDKMgr.getInst().loginParams = params;
			connectSdkLoginSrv(SDKMgr.getInst().loginParams);
		});	
	}

	function connectSdkLoginSrv(params){
		if(params == null) return;

		if(GameConst.State == InComeState.Ckeck){
			NetMgr.getInstance().loginUrl = GameConst.LoginUrl;
		}

		if(fetchGameConstSuccess){
			ServerAgency.getInstance().sdkLogin(params);
		}
	}

	// function getGameConst(){
	// 	var http = new HttpLaya(function(err, data) {
	// 		console.log("DATA:"+JSON.stringify(data));
	// 		if(err != null) {
	// 			loadRemoteGameConst();
	// 		}
	// 		else {
	// 			for(var key in data) {
	// 				GameConst[key] = data[key];
	// 			}

	// 			fetchGameConstSuccess = true;
	// 			connectSdkLoginSrv(SDKMgr.getInst().loginParams);
	// 		}
	// 	});
	// 	http.sendGetWithUrl(GameConst.PHPUrl+"realtime/GameConst");
	// }

	function loadRemoteGameConst() {
		var http = new HttpLaya(function(err, data) {
			console.log("GameConst:"+JSON.stringify(data));
			if(err != null) {
				console.log(err);
			}
			else {
				for(var key in data) {
					GameConst[key] = data[key];
				}
				fetchGameConstSuccess = true;
				connectSdkLoginSrv(SDKMgr.getInst().loginParams);
			}
		});
		http.sendGetWithUrl(GameConst.CDN+"GameConst.json?t="+Date.now());
	}

	/**
	 * 此处用于初始化隐藏 更好好玩或者底部banner 初始化不需要调用show，相应广告会根据后台返回数据进行显示
	 * 修改位置 大小都可以在回调这里处理，确保第一次没加载出节点时就能改变好位置大小
	 */
	function initAladinSDKCallback(){
		AladinSDK.getMoreNode().scaleX = 0.9;
		AladinSDK.getMoreNode().scaleY = 0.8;
	}

	function onShowWX(res){
		var path = res.path;
		if(path!=null){
			SDKMgr.getInst().report(ReportType.Launch,{openid:'',event:'launch'});
		}

		var query = res.query;
		if(query!=null && query.inviteName!=null || query.openid!=null){
			var inviteName = query.inviteName;
			var openid = query.openid;
			var sharePos = query.pos;
			var shareTime = query.shareTime;

			console.log("link:"+openid+" pos:"+sharePos);
			CheckIPMgr.uploadLink(sharePos,openid,shareTime);
			SDKMgr.getInst().report(ReportType.Link,{openid:'',event:'Link','inviteName':inviteName,'inviteOpenId':openid,'sharePos':sharePos});
		}

		if(res.referrerInfo && 
		   res.referrerInfo.extraData &&
		   res.referrerInfo.extraData.Ads === "Reward" &&
		   res.referrerInfo.extraData.AdsPos &&
		   res.referrerInfo.extraData.AdsPos === "wx3ac7faa4e813826e"){
			   //
			   console.log("来源于盒子回跳");
		   }
		
		EventMgr.getInstance().event(EEvent.GetFocus);
	}

	function onHideWX(){
		// console.log("wx.onHide");
	}

	function onNetworkStatusChange(res){
		if(res.networkType == 'none' || res.networkType == 'unknown'){
			GameConst.AvailableNet = false;
		}else{
			GameConst.AvailableNet = true;
		}

		console.log("networkType:"+res.networkType);
	}

	function compareVersion(v1, v2) {
		v1 = v1.split('.');
		v2 = v2.split('.');
		var len = Math.max(v1.length, v2.length);

		while (v1.length < len) {
			v1.push('0');
		}
		while (v2.length < len) {
			v2.push('0');
		}

		for (var i = 0; i < len; i++) {
			var num1 = parseInt(v1[i]);
			var num2 = parseInt(v2[i]);

			if (num1 > num2) {
				return 1;
			} else if (num1 < num2) {
				return -1;
			}
		}

		return 0;
	}

	return GameMain;
}());

new GameMain();
