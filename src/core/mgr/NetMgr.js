/*
* 网络管理器
*/
var NetMgr = (function () {
    function NetMgr() {
        this.initPomelo();
        this.listeners = [];
        this.m_host = "";
        this.m_port = 0;
        this.m_lastRecvHeartbeatTime = 0;
        this.kicked = false;
    }
    /**
     * 单例模式
     */
    NetMgr.getInstance = function () {
        if (NetMgr._instance == null) {
            NetMgr._instance = new NetMgr();
            NetMgr._instance.init();
        }
        return NetMgr._instance;
    };

    var p = NetMgr.prototype;

    p.init = function(){
        TimerUtil.loop(1000,this,this.checkHeartbeatTimeout);
    }

    p.checkHeartbeatTimeout = function(){
        if(this.pomelo == null) return;

        if(this.pomelo.heartbeatTimeout == 0) return;

        var curTime = Date.now();
        if(this.m_lastRecvHeartbeatTime == 0){
            return;
        }

        var gap = curTime - this.m_lastRecvHeartbeatTime;
        if(gap > this.pomelo.heartbeatTimeout){
            console.error("checkHeartbeatTimeout recv: "+gap);
            this.reconnectionPomelo();
        }

    }

    /**
     * 选择服务器
     */
    p.selectServer = function(enet) {
        this.host = enet.GameServer.IP;
        this.port = enet.GameServer.Port;
        this.wss = enet.GameServer.wss;
        this.url = enet.GameServer.url;
        this.loginUrl = enet.LoginUrl;
    }
    /**
     * 初始化Pomelo
     */
    p.initPomelo = function () {
        var reg = this;

        //网关服务器的连接
        this.gatePomelo = new PomeloLaya.Pomelo();
        this.gatePomelo.on(PomeloLaya.Pomelo.EVENT_IO_ERROR, function (event) {
            console.error("gatePomelo error", event);
        });
        this.gatePomelo.on(PomeloLaya.Pomelo.EVENT_CLOSE, function (event) {
            console.error("gatePomelo EVENT_CLOSE:"+event.code);
        });


        this.pomelo = new PomeloLaya.Pomelo();
        var self = this.pomelo;

        this.pomelo.on(PomeloLaya.Pomelo.EVENT_IO_ERROR, function (event) {
            //错误处理
            console.error("EVENT_IO_ERROR:", event);
            reg.reconnectionPomelo();
        });
        this.pomelo.on(PomeloLaya.Pomelo.EVENT_CLOSE, function (event) {
            console.error("EVENT_CLOSE:"+event.code);
            if(event!=null){
                if(event.code == undefined){
                    reg.reconnectionPomelo();
                }else{
                    if(event.code == 1006) {
                        reg.disconnectPomelo();
                    }
                    else if(event.code == 1000){
                        //服务器断开连接
                    }
                    else {
                        //错误处理
                        reg.reconnectionPomelo();
                    }
                }
             }
        });
        this.pomelo.on(PomeloLaya.Pomelo.EVENT_KICK, function(event) {
            console.log("EVENT_KICK");
            reg.kicked = true;
        });
    };


    /**
     * 断开链接
     */
    p.disconnectPomelo = function () {
        this.pomelo.disconnect();
    };
    /**
     * 重连
     */
    p.reconnectionPomelo = function () {
        this.pomelo.heartbeatTimeout = 0;
        this.pomelo.disconnect();

        TimerUtil.once(1500,this,this.reconnectServerTimer);
    };

    p.reconnectServerTimer = function(){
        ServerAgency.getInstance().reconnectServer();
    }

    /**
     * 获取端口
     */
    p.queryEntry = function (uid, callback) {
        var _this = this;
        var init_par = {
            host: this.host,
            port: this.port,
            url: this.url,
            wss: this.wss
        };
        this.gatePomelo.init(init_par, function (result) {
            if (result.code == ECode.OK) {
                var route = "gate.gateHandler.queryEntry";
                var msg = {
                    uid: uid
                };
                _this.gatePomelo.request(route, msg, function (result) {
                    if (result.code == ECode.GATE.FA_NO_SERVER_AVAILABLE) {
                        console.log("Servers error!");
                        return;
                    }
                    
                    // console.log("gateserver code:", result.code);

                    if (result.code == ECode.OK) {
                        _this.gatePomelo.disconnect();
                        callback(result.host, result.port);
                    }
                    else {
                        _this.gatePomelo.disconnect();
                    }
                });
            }
        });
    };


    /**
     * 连接
     */
    p.entry = function (host, port, token, callback) {
        if(this.kicked) return;

        var _this = this;
        var init_par = {
            host: host,
            port: port,
            url: "wss://"+host+"/startgame",
            wss: true,
        };

        this.pomelo.init(init_par, function (result) {
            _this.pomelo.request('connector.entryHandler.entry', { token: token }, function (data) {
                callback(data);
            });
        });
    };

    p.resendConfirmMsg = function(){
        console.log("reconnect server success");
        this.pomelo.SendConfirmQueue();
        this.pomelo.SendCacheQueue();
    }

    /**
     * @method RPC 远程过程调用
     * @param {String} rpcName 服务名字 eg. room.roomHandler.enterRoom
     * @param {Object} params json object
     * @param {Function} callback 回调函数
     */
    p.rpc = function(rpcName,params,callback,caller) {
        this.pomelo.request(rpcName,params,function(data) {
            if(callback != null)
                callback.call(caller,data);
        });
    }

    /**
     * @method RPC 发协议
     * @param {String} rpcName 服务名字 eg. room.roomHandler.enterRoom
     * @param {Object} params json object
     */
    p.send = function(rpcName,params) {
        this.pomelo.notify(rpcName,params);
    }

    p.register = function(name,callback,context) {
        var observers = this.listeners[name];
        if (!observers) {
            observers = [];
            this.listeners[name] = observers;
        }
        observers.push(new Observer(callback, context));

        this.pomelo.off(name);
        this.pomelo.on(name,function (data) {
            var observers = NetMgr._instance.listeners[name];
            if (!observers)
                return;
            var length = observers.length;
            for (var i = 0; i < length; i++) {
                var observer = observers[i];
                observer.notify.call(observer, data);
            }
        })
    }

    p.unregister = function(name,callback,context) {
        var observers = this.listeners[name];
        if (!observers)
            return;
        var length = observers.length;
        for (var i = 0; i < length; i++) {
            var observer = observers[i];
            if (observer.compar(context)) {
                observers.splice(i, 1);
                break;
            }
        }
        if (observers.length == 0) {
            delete this.listeners[name];
        }
    }

    p.connected = function(){
        if(this.pomelo.socket == null) return false;

        return this.pomelo.socket.connected;
    }

    p.miniServerCallback = function(reqId,retData){
        var cb = this.pomelo.callbacks[reqId];
        if(cb!=null){
            cb(retData);
            delete this.pomelo.callbacks[reqId];
        }
    }


    return NetMgr;
}());

/**
 * 观察者
 */
var Observer = /** @class */ (function () {
    function Observer(callback, context) {
        /** 回调函数 */
        this.callback = null;
        /** 上下文 */
        this.context = null;
        var self = this;
        self.callback = callback;
        self.context = context;
    }
    /**
     * 发送通知
     * @param args 不定参数
     */
    Observer.prototype.notify = function (data) {
        var self = this;
        (_a = self.callback).call(_a, data);
        var _a;
    };
    /**
     * 上下文比较
     * @param context 上下文
     */
    Observer.prototype.compar = function (context) {
        return context == this.context;
    };
    return Observer;
}());

NetMgr._instance = null;