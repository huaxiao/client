/**
 * 创建时间 2017/04/16 
 * modifiy 2018/06/22
 */
var PomeloLaya;
(function (PomeloLaya) {
    var Pomelo = (function () {
        function Pomelo() {
            this.JS_WS_CLIENT_TYPE = 'js-websocket';
            this.JS_WS_CLIENT_VERSION = '0.0.5';
            this.RES_OK = 200;
            this.RES_FAIL = 500;
            this.RES_OLD_CLIENT = 501;

            this.socket = null;
            this.callbacks = {};
            this.handlers = {};
            // Map from request id to route
            this.routeMap = {};
            this.heartbeatInterval = 0;
            this.heartbeatTimeout = 0;
            this.nextHeartbeatTimeout = 0;
            this.gapThreshold = 100;
            this.heartbeatId = null;
            this.heartbeatTimeoutId = null;
            this.heartbeatdata = null;
            this.handshakeCallback = null;
            this.initCallback = null;
            this.handshakeBuffer = {
                'sys': {
                    type: this.JS_WS_CLIENT_TYPE,
                    version: this.JS_WS_CLIENT_VERSION
                },
                'user': {}
            };
            this._callbacks = {};
            this.reqId = 0;
            if (!console.group) {
                console.group = console.log;
                console.groupEnd = function () { console.log("----"); };
                console.info = console.log;
                console.warn = console.log;
                console.error = console.log;
            }
            this._message = new Message();
            this._package = new Package();
            this._stateObject = new StateObject();
            this._headBytes = new Laya.Byte(4);
            this._headBytes.endian = Laya.Byte.BIG_ENDIAN;

            this.handlers[Package.TYPE_HANDSHAKE] = this.handshake;
            this.handlers[Package.TYPE_HEARTBEAT] = this.heartbeat;
            this.handlers[Package.TYPE_DATA] = this.onData;
            this.handlers[Package.TYPE_KICK] = this.onKick;
            this.sendCacheQueue = [];
            this.confirmMap = {};
        }
        Pomelo.prototype.init = function (params, cb) {
            // console.log("init", params);
            this.initCallback = cb;
            var host = params.host;
            var port = params.port;
            var domain = params.url;
            var useWss = params.wss;
            this.handshakeBuffer.user = params.user;
            this.handshakeCallback = params.handshakeCallback;
            this.initWebSocket(host,domain, port,useWss, cb);
        };
        Pomelo.prototype.initWebSocket = function (host,url,port,useWss, cb) {
            if(GameConst.NetLog)
                console.log("[Pomelo] connect to:", host, port);
            this.socket = new Laya.Socket();

            //用的子协议，字符串或数组
            // this.socket.protocols = egret.WebSocket.TYPE_BINARY;
            this.socket.on(Laya.Event.OPEN, this, this.onConnect);
            this.socket.on(Laya.Event.CLOSE, this, this.onClose);
            this.socket.on(Laya.Event.ERROR, this, this.onIOError);
            this.socket.on(Laya.Event.MESSAGE, this, this.onMessage);

            if(useWss){
                console.log("url:"+url);
                this.socket.connectByUrl(url);
            }else{
                console.log("host:"+host+" port:"+port);
                this.socket.connect(host,port); 
            }
        };
        Pomelo.prototype.on = function (event, fn) {
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
        };
        Pomelo.prototype.SendCacheQueue = function() {
            if (this.socket == null || !this.socket.connected) return;
            if(this.sendCacheQueue.length == 0) return;
            var data = this.sendCacheQueue.shift();
            if(data.cb != null) {
                this.request(data.route,data.msg,data.cb);
            }
            else {
                this.notify(data.route,data.msg);
            }
        };

        Pomelo.prototype.SendConfirmQueue = function(){
            if (this.socket == null || !this.socket.connected) return;

            var temp = {};
            for(var i in this.confirmMap){
                temp[i] = this.confirmMap[i];
                delete this.confirmMap[i];
            }
            
            for(var i in temp){
                var data = temp[i];
                delete temp[i];
                this.request(data.route,data.msg,data.cb);
            }
        };

        Pomelo.prototype.request = function (route, msg, cb) {
            // if (!this.checkCanSend(route,msg,cb)) {
            //     return;
            // }

            if (arguments.length === 2 && typeof msg === 'function') {
                cb = msg;
                msg = {};
            }
            else {
                msg = msg || {};
            }
            route = route || msg.route;
            if (!route) {
                return;
            }
            this.reqId++;
            if (this.reqId > 127) {
                this.reqId = 1;
            }
            var reqId = this.reqId;
            if (GameConst.NetLog) {
                console.group("REQUEST:");
                console.info("Route:", route);
                console.log("Id:", reqId);
                console.log("Param:", msg);
                console.groupEnd();
            }
            this.callbacks[reqId] = cb;
            this.routeMap[reqId] = route;
            this.confirmMap[reqId] = {route:route,msg:msg,cb:cb};
            this.sendMessage(reqId, route, msg);
        };
        
        Pomelo.prototype.notify = function (route, msg) {
            // if (!this.checkCanSend(route,msg)) {
            //     return; 不需要确保网络
            // }

            if (GameConst.NetLog) {
                console.group("REQUEST:");
                console.info("Route:", route);
                console.log("Id:", 0);
                console.log("Param:", msg);
                console.groupEnd();
            }

            this.sendMessage(0, route, msg);
        };

        Pomelo.prototype.checkCanSend = function (route, msg, cb) {
            if (this.socket == null || !this.socket.connected) {
                this.sendCacheQueue.push({route:route,msg:msg,cb:cb});
                return false;
            }
            return true;
        }

        // var _receiveByte;
        //Pomelo.receiveSize = 0;
        Pomelo.prototype.onMessage = function (event) {
            if (event instanceof ArrayBuffer) {
                var byte = new Laya.Byte(event);
                byte.endian = Laya.Byte.BIG_ENDIAN;
                if(this.socket!=null){
                    this.socket.input.clear();
                }
                // Pomelo.logByte(byte);
                // this.onReceived(byte,byte.length);
                this.processPackage(this._package.decode(byte));
            }
        };

        var _headLength = 4;
        
        Pomelo.prototype.onReceived = function(buffer,len){
            this._stateObject.Write(buffer,len);

            while(true){
                var len = this._stateObject.StreamLength();
                if(len == 0) break;

                if((this._stateObject.m_receiveBody && len < this._stateObject.m_buffLength) || 
                (!this._stateObject.m_receiveBody && len < _headLength))  break;

                if ((!this._stateObject.m_receiveBody) && (len >= _headLength))
                {
                    var orgPos = this._stateObject.StreamPosition();
                    this._stateObject.SetStreamPosition(0);
                    
                    this._headBytes.clear();
                    this._headBytes.pos = 0;
                    StateObject.writeBytes2(this._stateObject.m_stream,this._headBytes,0,_headLength);
                    this._headBytes.pos = 0;

                    this._stateObject.m_type = this._headBytes.getUint8();
                    this._stateObject.m_bodyLength = (this._headBytes.getUint8() << 16 | this._headBytes.getUint8() << 8 | this._headBytes.getUint8()) >>> 0;
                    if(this._stateObject.m_type == 0){
                        this._stateObject.Reset();
                        continue;
                    }
                        
                    
                    this._stateObject.m_buffLength = this._stateObject.m_bodyLength + 4;
                    this._stateObject.m_receiveBody = true;   
                    this._stateObject.SetStreamPosition(orgPos);     
                }

                if(this._stateObject.m_receiveBody  && len >= this._stateObject.m_buffLength){
                    if (this._stateObject.m_buffer.length < this._stateObject.m_buffLength)
                    {
                        this._stateObject.m_buffer = new Laya.Byte(this._stateObject.m_buffLength + 1024 - this._stateObject.m_buffLength % 1024);
                        this._stateObject.m_buffer.endian = Laya.Byte.BIG_ENDIAN;
                    }

                    var data_bytes = this._stateObject.m_buffer;
                    this._stateObject.SetStreamPosition(0);
                    data_bytes.pos = 0;
                    StateObject.writeBytes2(this._stateObject.m_stream,data_bytes,0,this._stateObject.m_buffLength);
                    data_bytes.pos = 0;

                    var buffLen = this._stateObject.m_buffLength;
                    var parseSize = 0;

                    this.processPackage(this._package.decode(data_bytes));

                    this._stateObject.Reset();
                }
            }
        }

        var _sendByte,_bodyByte;
        Pomelo.sendSize = 0;
        Pomelo.prototype.sendMessage = function (reqId, route, msg) {
            if (this.socket == null || !this.socket.connected) {
                MiniServer.getInstance().handleMessage(reqId,route,msg);
                return;
            }

            var byte;
            var msgbuffer = this._message.encode(reqId, route, msg);
            byte = this._package.encode(Package.TYPE_DATA, msgbuffer);
            this.send(byte);
        };
        Pomelo.prototype.onConnect = function (e) {
            // console.log("[Pomelo] connect success", e);
            var handshakejson = JSON.stringify(this.handshakeBuffer);
            if(GameConst.NetLog)
                console.log("handshakejson :", handshakejson);
            var handshakebuffer = Protocol.strencode(handshakejson);
            var buffer = this._package.encode(Package.TYPE_HANDSHAKE, handshakebuffer);
            this.send(buffer);
            // this.socket.output.writeArrayBuffer(buffer);
            // this.socket.flush();
        };
        Pomelo.prototype.onClose = function (e) {
            // console.warn("[Pomelo] connect close:", e);
            this.emit(Pomelo.EVENT_CLOSE, e);
        };
        Pomelo.prototype.onIOError = function (e) {
            this.emit(Pomelo.EVENT_IO_ERROR, e);
            console.error('socket error: ', e);
        };
        Pomelo.prototype.onKick = function (data) {
            var bodystr = Protocol.strdecode(data);
            var bodyjson = JSON.parse(bodystr); 
            console.warn("[Pomelo] connect kick:", bodyjson);
            this.emit(Pomelo.EVENT_KICK, bodyjson);
        };
        Pomelo.prototype.onData = function (data) {
           //probuff decode
            var msg = this._message.decode(data);
            if (GameConst.NetLog)
                console.log("onData msg:", msg);
            if (msg.id > 0) {
                delete this.confirmMap[msg.id];  

                msg.route = this.routeMap[msg.id];
                delete this.routeMap[msg.id];
                if (!msg.route) {
                    return;
                }
            }
            //msg.body = this.deCompose(msg);
            this.processMessage(msg);
        };
        Pomelo.prototype.processMessage = function (msg) {
            if (!msg.id) {
                // server push message
                if (GameConst.NetLog) {
                    console.group("EVENT:");
                    console.info("Route:", msg.route);
                    console.info("Msg:", msg.body);
                    console.groupEnd();
                }
                this.emit(msg.route, msg.body);
                return;
            }
            if (GameConst.NetLog) {
                console.group("RESPONSE:");
                console.info("Id:", msg.id);
                console.info("Msg:", msg.body);
                console.groupEnd();
            }
            //if have a id then find the callback function with the request
            var cb = this.callbacks[msg.id];
            delete this.callbacks[msg.id];
            if (typeof cb !== 'function') {
                return;
            }
            if (msg.body && msg.body.code == 500) {
                var obj = { "code": 500, "desc": "服务器内部错误", "key": "INTERNAL_ERROR" };
                msg.body.error = obj;
            }
            cb(msg.body);
            return;
        };
        Pomelo.prototype.heartbeat = function (data) {

            NetMgr.getInstance().m_lastRecvHeartbeatTime = Date.now();
            
            if (!this.heartbeatInterval) {
                // no heartbeat
                return;
            }
            if (this.heartbeatTimeoutId) {
                Laya.timer.clear(this, this.heartbeatTimeoutCb);
                this.heartbeatTimeoutId = null;
            }
            if (this.heartbeatId) {
                // already in a heartbeat interval
                return;
            }

            this.heartbeatdata = data;
            this.heartbeatId = 1;
            Laya.timer.once(this.heartbeatInterval, this, this.sendHeartbeat);
        };

        Pomelo.prototype.sendHeartbeat = function(){
            var obj = this._package.encode(Package.TYPE_HEARTBEAT);
            this.heartbeatId = null;
            this.send(obj);
            this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
            this.heartbeatTimeoutId = 1;
            Laya.timer.once(this.heartbeatTimeout, this, this.heartbeatTimeoutCb);
        }

        Pomelo.prototype.heartbeatTimeoutCb = function () {
            this.heartbeatTimeoutId = null;
            var gap = this.nextHeartbeatTimeout - Date.now();
            if (gap > this.gapThreshold) {
                Laya.timer.once(gap, this, this.heartbeatTimeoutCb);
                this.heartbeatTimeoutId  = 1;
            }
            else {
                console.error('server heartbeat timeout '+Date.now(), this.heartbeatdata);
                this.emit(Pomelo.EVENT_HEART_BEAT_TIMEOUT, this.heartbeatdata);
                this._disconnect();
                NetMgr.getInstance().reconnectionPomelo();
            }
        };
        Pomelo.prototype.off = function (event, fn) {
            this.removeAllListeners(event, fn);
        };
        Pomelo.prototype.removeAllListeners = function (event, fn) {
            // all
            if (0 == arguments.length) {
                this._callbacks = {};
                return;
            }
            // specific event
            var callbacks = this._callbacks[event];
            if (!callbacks) {
                return;
            }
            // remove all handlers
            if (event && !fn) {
                delete this._callbacks[event];
                return;
            }
            // remove specific handler
            var i = this.index(callbacks, fn && fn._off);
            if (~i) {
                callbacks.splice(i, 1);
            }
            return;
        };
        Pomelo.prototype.index = function (arr, obj) {
            if ([].indexOf) {
                return arr.indexOf(obj);
            }
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj)
                    return i;
            }
            return -1;
        };
        Pomelo.prototype.disconnect = function () {
            this._disconnect();
        };

        Pomelo.prototype._disconnect = function () {
            // console.warn("[Pomelo] client disconnect ...");
            if (this.socket && this.socket.connected)
                this.socket.close();
            this.socket = null;
            if (this.heartbeatId) {
                Laya.timer.clear(this, this.sendHeartbeat);
                this.heartbeatId = null;
            }
            if (this.heartbeatTimeoutId) {
                Laya.timer.clear(this, this.heartbeatTimeoutCb);
                this.heartbeatTimeoutId = null;
            }
        };
        Pomelo.prototype.processPackage = function (msg) {
            this.handlers[msg.type].apply(this, [msg.body]);
        };
        Pomelo.prototype.handshake = function (resData) {
            var resStr = Protocol.strdecode(resData);
            if(GameConst.NetLog)
                console.log("resStr:",resStr);//握手
            var data = JSON.parse(resStr);
            if (data.code === this.RES_OLD_CLIENT) {
                this.emit(Pomelo.EVENT_IO_ERROR, 'client version not fullfill');
                return;
            }
            if (data.code !== this.RES_OK) {
                this.emit(Pomelo.EVENT_IO_ERROR, 'handshake fail');
                return;
            }
            this.handshakeInit(data);
            var obj = this._package.encode(Package.TYPE_HANDSHAKE_ACK);
            this.send(obj);
            if (this.initCallback) {
                this.initCallback(data);
                this.initCallback = null;
            }
        };
        Pomelo.prototype.handshakeInit = function (data) {
            if (data.sys) {
                Routedic.init(data.sys.dict);
                Protobuf.init(data.sys.protos);
            }
            if (data.sys && data.sys.heartbeat) {
                this.heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
                this.heartbeatTimeout = this.heartbeatInterval * 2; // max heartbeat timeout
            }
            else {
                this.heartbeatInterval = 0;
                this.heartbeatTimeout = 0;
            }
            if (typeof this.handshakeCallback === 'function') {
                this.handshakeCallback(data.user);
            }
        };
        Pomelo.prototype.send = function (byte) {
            if (this.socket && this.socket.connected) {
                var byteArray = new ArrayBuffer(byte.length);
                byte.pos = 0;
                // var bytestr = "length:" + byte.length + "[";
                for (var i = 0; i < byte.length; i++) {
                    var rbyte = byte.readByte();
                    this.socket.output.writeByte(rbyte);
                    // if (i == byte.length - 1) {
                    //     bytestr += rbyte + "";
                    // }
                    // else {
                    //     bytestr += rbyte + ",";
                    // }
                }
                // bytestr += "]";
                // console.log("send :"+bytestr);
                this.socket.flush();
            }
        };
        Pomelo.prototype.emit = function (event,data) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var params = [].slice.call(arguments, 1);
            var callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, params);
                }
            }
            return this;
        };
        /**
         *
         * 写入Laya.Byte
         * @param(Laya.Byte) 需要写入的Laya.Byte
         * @param(Laya.Byte) 写入的Laya.Byte
         *
         */
        Pomelo.writeBytes = function (fromByte, toByte) {
            fromByte.pos = 0;
            for (var i = 0; i < fromByte.length; i++) {
                var rbyte = fromByte.getByte();
                toByte.writeByte(rbyte);
            }
        };
        /**
         * 打印Laya.Byte
         */
        Pomelo.logByte = function (byte) {
             byte.pos = 0;
            var bytestr = "length:" + byte.length + "\r\n[";
            for (var i = 0; i < byte.length; i++) {
                var rbyte = byte.getByte();
                if (i == byte.length - 1) {
                    bytestr += rbyte + "";
                }
                else {
                    bytestr += rbyte + ",";
                }
            }
            bytestr += "]";
            // console.log(bytestr);
        };
        return Pomelo;
    }());

    Pomelo.EVENT_IO_ERROR = "io-error";
    Pomelo.EVENT_CLOSE = "close";
    Pomelo.EVENT_KICK = "onKick";
    Pomelo.EVENT_HEART_BEAT_TIMEOUT = 'heartbeat timeout';
    PomeloLaya.Pomelo = Pomelo;
    // Map from request id to route
    //Pomelo.routeMap = {};

    /**
     * Package 包体
     */
    var Package = (function () {
        function Package() {
        }
        Package.prototype.encode = function (type, body) {
            var length = body ? body.length : 0;
            var buffer = new Laya.Byte();
            //buffer.endian = Laya.Byte.LITTLE_ENDIAN;
            buffer.writeByte(type & 0xff);
            buffer.writeByte((length >> 16) & 0xff);
            buffer.writeByte((length >> 8) & 0xff);
            buffer.writeByte(length & 0xff);
            // if(body) buffer.writeArrayBuffer(body, 0, body.length);
            if (body) {
                Pomelo.writeBytes(body, buffer);
            }
            return buffer;
        };
        Package.prototype.decode = function (buffer) {
            var type = buffer.getUint8();
            var len = (buffer.getUint8() << 16 | buffer.getUint8() << 8 | buffer.getUint8()) >>> 0;
            var body;
            if (buffer.bytesAvailable >= len) {
                // body = new Laya.Byte();
                // if (len) buffer.writeArrayBuffer(body, 0, len);
                if (len) {
                    body = new Laya.Byte(buffer.getUint8Array(buffer.pos, len));
                    body.endian = Laya.Byte.BIG_ENDIAN;
                }
            }
            else {
                console.log("[Package] no enough length for current type:", type);
            }
            return { type: type, body: body, length: len };
        };
        return Package;
    }());
    Package.TYPE_HANDSHAKE = 1;
    Package.TYPE_HANDSHAKE_ACK = 2;
    Package.TYPE_HEARTBEAT = 3;
    Package.TYPE_DATA = 4;
    Package.TYPE_KICK = 5;

    /**
     * Message 消息
     */
    var Message = (function () {
        function Message() {
        }
        Message.prototype.encode = function (id, route, msg) {
            var buffer = new Laya.Byte();
            //buffer.endian = Laya.Byte.LITTLE_ENDIAN;
            var type = id ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;
            var byte = Protobuf.encode(route, msg) || Protocol.strencode(JSON.stringify(msg));
            var rot = Routedic.getID(route) || route;
            //add flag 
            buffer.writeByte((type << 1) | ((typeof (rot) == "string") ? 0 : 1));
            if (id) {
                // 7.x
                do {
                    var tmp = id % 128;
                    var next = Math.floor(id / 128);
                    if (next != 0) {
                        tmp = tmp + 128;
                    }
                    buffer.writeByte(tmp);
                    id = next;
                } while (id != 0);
            }
            if (rot) {
                if (typeof rot == "string") {
                    buffer.writeByte(rot.length & 0xff);
                    buffer.writeUTFBytes(rot);
                }
                else {
                    buffer.writeByte((rot >> 8) & 0xff);
                    buffer.writeByte(rot & 0xff);
                }
            }
            if (byte) {
                Pomelo.writeBytes(byte, buffer);
            }
            return buffer;
        };

        //https://github.com/NetEase/pomelo/wiki/Pomelo-%E5%8D%8F%E8%AE%AE
        Message.prototype.decode = function (buffer) {
            // parse flag
            var flag = buffer.getUint8();
            var compressRoute = flag & Message.MSG_COMPRESS_ROUTE_MASK;
            var type = (flag >> 1) & Message.MSG_TYPE_MASK;
            var route;
            // parse id
            var id = 0;
            if (type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE) {
                // 7.x
                var i = 0;
                do {
                    var m = buffer.getUint8();
                    id = id + ((m & 0x7f) * Math.pow(2, (7 * i)));
                    i++;
                } while (m >= 128);
            }
            // parse route
            if (type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY || type === Message.TYPE_PUSH) {
                if (compressRoute) {
                    route = buffer.getUint16();
                }
                else {
                    var routeLen = buffer.getUint8();
                    route = routeLen ? buffer.readUTFBytes(routeLen) : "";
                }
            }
            //else if (type === Message.TYPE_RESPONSE)
            //{
            //    route = Pomelo.requests[id].route;
            //}
            //
            if (!id && !(typeof (route) == "string")) {
                route = Routedic.getName(route);
            }
            if (route == undefined) {
                route = '';
            }
            var bodyarray = Protobuf.decode(route, buffer); //此处后期需要完善
            var body;
            if (bodyarray) {
                body = bodyarray;
            }
            else {
                if(buffer.bytesAvailable != 0){
                    var bodystr = Protocol.strdecode(new Laya.Byte(buffer.getUint8Array(buffer.pos, buffer.bytesAvailable)));
                    var bodyjson = JSON.parse(bodystr);
                    body = bodyjson;
                }
            }
            return { id: id, type: type, route: route, body: body };
        };
        Message.prototype.encodeMsgFlag = function (type, compressRoute, buffer) {
            if (type !== Message.TYPE_REQUEST && type !== Message.TYPE_NOTIFY &&
                type !== Message.TYPE_RESPONSE && type !== Message.TYPE_PUSH) {
                throw new Error('unkonw message type: ' + type);
            }
            buffer.writeByte((type << 1) | (compressRoute ? 1 : 0));
        };
        ;
        return Message;
    }());
    Message.MSG_FLAG_BYTES = 1;
    Message.MSG_ROUTE_CODE_BYTES = 2;
    Message.MSG_ID_MAX_BYTES = 5;
    Message.MSG_ROUTE_LEN_BYTES = 1;
    Message.MSG_ROUTE_CODE_MAX = 0xffff;
    Message.MSG_COMPRESS_ROUTE_MASK = 0x1;
    Message.MSG_TYPE_MASK = 0x7;
    Message.TYPE_REQUEST = 0;
    Message.TYPE_NOTIFY = 1;
    Message.TYPE_RESPONSE = 2;
    Message.TYPE_PUSH = 3;

    /**
     * Protocol json格式协议
     */
    var Protocol = (function () {
        function Protocol() {
        }
        Protocol.strencode = function (str) {
            // console.warn('Protocol strEncode',str); //检测是否发字符串
            var buffer = new Laya.Byte();
            buffer.length = str.length;
            buffer.writeUTFBytes(str);
            return buffer;
        };
        Protocol.strdecode = function (byte) {
            // return byte.readUTFBytes(byte.bytesAvailable);
            // var bytes = new ByteArray(buffer);
            var array = [];
            var offset = 0;
            var charCode = 0;
            var end = byte.length;
            byte.pos = 0;

            while (offset < end) {
                var index = byte.getUint8();
                if (index < 128) {
                    charCode = index;
                    offset += 1;
                }
                else if (index < 224) {
                    charCode = ((index & 0x3f) << 6) + (byte.getUint8() & 0x3f);
                    offset += 2;
                }
                else {
                    charCode = ((index & 0x0f) << 12) + ((byte.getUint8() & 0x3f) << 6) + (byte.getUint8() & 0x3f);
                    offset += 3;
                }
                array.push(charCode);
            }
            var res = '';
            var chunk = 8 * 1024;
            var i;
            for (i = 0; i < array.length / chunk; i++) {
                res += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
            }
            res += String.fromCharCode.apply(null, array.slice(i * chunk));
            return res;
        };
        Protocol.copyArray = function (dest, doffset, src, soffset, length) {
            if ('function' === typeof src.copy) {
                // Buffer
                src.copy(dest, doffset, soffset, soffset + length);
            }
            else {
                // Uint8Array
                for (var index = 0; index < length; index++) {
                    dest[doffset++] = src[soffset++];
                }
            }
        };
        ;
        return Protocol;
    }());

    /**
     * Protobuf
     */
    var Protobuf = (function () {
        function Protobuf() {
        }
        Protobuf.init = function (protos) {
            this._clients = protos && protos.client || {};
            this._servers = protos && protos.server || {};
        };
        Protobuf.encode = function (route, msg) {
            var protos = this._clients[route];
            if (!protos)
                return null;
            return this.encodeProtos(protos, msg);
        };
        Protobuf.decode = function (route, buffer) {
            var protos = this._servers[route];
            if (!protos)
                return null;
            return this.decodeProtos(protos, buffer);
        };
        Protobuf.encodeProtos = function (protos, msg) {
            var buffer = new Laya.Byte();
            for (var name in msg) {
                if (protos[name]) {
                    var proto = protos[name];
                    switch (proto.option) {
                        case "optional":
                        case "required":
                            buffer.writeArrayBuffer(this.encodeTag(proto.type, proto.tag));
                            this.encodeProp(msg[name], proto.type, protos, buffer);
                            break;
                        case "repeated":
                            if (!!msg[name] && msg[name].length > 0) {
                                this.encodeArray(msg[name], proto, protos, buffer);
                            }
                            break;
                    }
                }
            }
            return buffer;
        };
        Protobuf.decodeProtos = function (protos, buffer) {
            var msg = {};
            while (buffer.bytesAvailable) {
                var head = this.getHead(buffer);
                var name = protos.__tags[head.tag];
                switch (protos[name].option) {
                    case "optional":
                    case "required":
                        msg[name] = this.decodeProp(protos[name].type, protos, buffer);
                        break;
                    case "repeated":
                        if (!msg[name]) {
                            msg[name] = [];
                        }
                        this.decodeArray(msg[name], protos[name].type, protos, buffer);
                        break;
                }
            }
            return msg;
        };
        Protobuf.encodeTag = function (type, tag) {
            var value = this.TYPES[type] != undefined ? this.TYPES[type] : 2;
            return this.encodeUInt32((tag << 3) | value);
        };
        Protobuf.getHead = function (buffer) {
            var tag = this.decodeUInt32(buffer);
            return { type: tag & 0x7, tag: tag >> 3 };
        };
        Protobuf.encodeProp = function (value, type, protos, buffer) {
            switch (type) {
                case 'uInt32':
                    // buffer.writeArrayBuffer(this.encodeUInt32(value));
                    Pomelo.writeBytes(this.encodeUInt32(value), buffer);
                    break;
                case 'int32':
                case 'sInt32':
                    // buffer.writeArrayBuffer(this.encodeSInt32(value));
                    Pomelo.writeBytes(this.encodeSInt32(value), buffer);
                    break;
                case 'float':
                    //Float32Array
                    // var floats:Laya.Byte = new Laya.Byte();
                    // floats.endian = Laya.Byte.LITTLE_ENDIAN;
                    // floats.getFloat32(value);
                    // buffer.writeArrayBuffer(floats);
                    Pomelo.writeBytes(this.encodeFloat(value), buffer);
                    break;
                case 'double':
                    // var doubles:Laya.Byte = new Laya.Byte();
                    // doubles.endian = Laya.Byte.LITTLE_ENDIAN;
                    // doubles.getFloat32(value);
                    // buffer.writeArrayBuffer(doubles);
                    Pomelo.writeBytes(this.encodeDouble(value), buffer);
                    break;
                case 'string':
                    // buffer.writeArrayBuffer(this.encodeUInt32(value.length));
                    Pomelo.writeBytes(this.encodeUInt32(value.length), buffer);
                    buffer.writeUTFBytes(value);
                    break;
                default:
                    var proto = protos.__messages[type] || this._clients["message " + type];
                    if (!!proto) {
                        var buf = this.encodeProtos(proto, value);
                        // buffer.writeArrayBuffer(this.encodeUInt32(buf.length));
                        Pomelo.writeBytes(this.encodeUInt32(value.length), buffer);
                        buffer.writeArrayBuffer(buf);
                    }
                    break;
            }
        };
        Protobuf.decodeProp = function (type, protos, buffer) {
            switch (type) {
                case 'uInt32':
                    return this.decodeUInt32(buffer);
                case 'int32':
                case 'sInt32':
                    return this.decodeSInt32(buffer);
                case 'float':
                    var floats = new Laya.Byte();
                    // buffer.writeArrayBuffer(floats, 0, 4);
                    var uint8arry = buffer.getUint8Array(0, 4);
                    for (var i = 0; i < uint8arry.length; i++) {
                        floats.writeByte(uint8arry[i]);
                    }
                    floats.endian = Laya.Byte.LITTLE_ENDIAN;
                    var float = buffer.getFloat32();
                    return floats.getFloat32();
                case 'double':
                    var doubles = new Laya.Byte();
                    // buffer.writeArrayBuffer(doubles, 0, 8);
                    var uint8arry = buffer.getUint8Array(0, 8);
                    for (var i = 0; i < uint8arry.length; i++) {
                        doubles.writeByte(uint8arry[i]);
                    }
                    doubles.endian = Laya.Byte.LITTLE_ENDIAN;
                    return doubles.getFloat64();
                case 'string':
                    var length = this.decodeUInt32(buffer);
                    return buffer.readUTFBytes(length);
                default:
                    var proto = protos && (protos.__messages[type] || this._servers["message " + type]);
                    if (proto) {
                        var len = this.decodeUInt32(buffer);
                        if (len) {
                            var buf = new Laya.Byte();
                            // buffer.writeArrayBuffer(buf, 0, len);
                            var uint8arry = buffer.getUint8Array(0, len);
                            for (var i = 0; i < uint8arry.length; i++) {
                                buf.writeByte(uint8arry[i]);
                            }
                        }
                        return len ? Protobuf.decodeProtos(proto, buf) : false;
                    }
                    break;
            }
        };
        Protobuf.isSimpleType = function (type) {
            return (type === 'uInt32' ||
                type === 'sInt32' ||
                type === 'int32' ||
                type === 'uInt64' ||
                type === 'sInt64' ||
                type === 'float' ||
                type === 'double');
        };
        Protobuf.encodeArray = function (array, proto, protos, buffer) {
            var isSimpleType = this.isSimpleType;
            if (isSimpleType(proto.type)) {
                // buffer.writeArrayBuffer(this.encodeTag(proto.type, proto.tag));
                // buffer.writeArrayBuffer(this.encodeUInt32(array.length));
                Pomelo.writeBytes(this.encodeTag(proto.type, proto.tag), buffer);
                Pomelo.writeBytes(this.encodeUInt32(array.length), buffer);
                var encodeProp = this.encodeProp;
                for (var i = 0; i < array.length; i++) {
                    encodeProp(array[i], proto.type, protos, buffer);
                }
            }
            else {
                var encodeTag = this.encodeTag;
                for (var j = 0; j < array.length; j++) {
                    // buffer.writeArrayBuffer(encodeTag(proto.type, proto.tag));
                    Pomelo.writeBytes(this.encodeTag(proto.type, proto.tag), buffer);
                    this.encodeProp(array[j], proto.type, protos, buffer);
                }
            }
        };
        Protobuf.decodeArray = function (array, type, protos, buffer) {
            var isSimpleType = this.isSimpleType;
            var decodeProp = this.decodeProp;
            if (isSimpleType(type)) {
                var length = this.decodeUInt32(buffer);
                for (var i = 0; i < length; i++) {
                    array.push(decodeProp(type, protos, buffer));
                }
            }
            else {
                array.push(decodeProp(type, protos, buffer));
            }
        };
        Protobuf.encodeUInt32 = function (n) {
            var result = new Laya.Byte();
            do {
                var tmp = n % 128;
                var next = Math.floor(n / 128);
                if (next !== 0) {
                    tmp = tmp + 128;
                }
                result.writeByte(tmp);
                n = next;
            } while (n !== 0);
            return result;
        };
        Protobuf.decodeUInt32 = function (buffer) {
            var n = 0;
            for (var i = 0; i < buffer.length; i++) {
                var m = buffer.getUint8();
                n = n + ((m & 0x7f) * Math.pow(2, (7 * i)));
                if (m < 128) {
                    return n;
                }
            }
            return n;
        };
        Protobuf.encodeSInt32 = function (n) {
            n = n < 0 ? (Math.abs(n) * 2 - 1) : n * 2;
            return this.encodeUInt32(n);
        };
        Protobuf.decodeSInt32 = function (buffer) {
            var n = this.decodeUInt32(buffer);
            var flag = ((n % 2) === 1) ? -1 : 1;
            n = ((n % 2 + n) / 2) * flag;
            return n;
        };
        Protobuf.encodeFloat = function (value) {
            var floats = new Laya.Byte;
            floats.endian = Laya.Byte.LITTLE_ENDIAN;
            floats.writeFloat32(value);
            return floats;
        };
        ;
        Protobuf.encodeDouble = function (value) {
            var floats = new Laya.Byte;
            floats.endian = Laya.Byte.LITTLE_ENDIAN;
            floats.writeFloat64(value);
            return floats;
        };
        ;
        return Protobuf;
    }());
    Protobuf.TYPES = {
        uInt32: 0,
        sInt32: 0,
        int32: 0,
        double: 1,
        string: 2,
        message: 2,
        float: 5
    };
    Protobuf._clients = {};
    Protobuf._servers = {};
    var Routedic = (function () {
        function Routedic() {
        }
        Routedic.init = function (dict) {
            this._names = dict || {};
            var _names = this._names;
            var _ids = this._ids;
            for (var name in _names) {
                _ids[_names[name]] = name;
            }
        };
        Routedic.getID = function (name) {
            return this._names[name];
        };
        Routedic.getName = function (id) {
            return this._ids[id];
        };
        return Routedic;
    }());
    Routedic._ids = {};
    Routedic._names = {};

})(PomeloLaya || (PomeloLaya = {}));