/*
* StateObject;
*/
var StateObject = (function () {
    var StateObject = Class();
	var p=StateObject.prototype;

	p.ctor = function(){
		this.m_stream = new Laya.Byte();
        this.m_stream.endian = Laya.Byte.BIG_ENDIAN;

        this.m_swapStream = new Laya.Byte();
        this.m_swapStream.endian = Laya.Byte.BIG_ENDIAN;

        this.m_buffer = new Laya.Byte(1024*1024);
        this.m_buffer.endian = Laya.Byte.BIG_ENDIAN;

        this.m_buffLength = 0;
        this.m_bodyLength = 0;
        this.m_receiveBody = false;
        this.m_type = 0;
	}

    p.StreamLength = function(){
        return this.m_stream.length;
    }

    p.StreamPosition = function(){
        return this.m_stream.pos;
    }

    p.SetStreamPosition = function(value){
        this.m_stream.pos = value;
    }

    p.Write = function(buff,len){
        this.m_stream.pos = this.m_stream.length;
        StateObject.writeBytes2(buff,this.m_stream,0,len);
        //this.m_stream.writeArrayBuffer(buff,0,len);
        this.m_stream.pos = 0;
    }

    p.Reset = function(){
        var remain_len = parseInt(this.m_stream.length - this.m_stream.pos);
        this.m_swapStream.clear();
        this.m_swapStream.pos = 0;

        if (remain_len != 0)
        {
            //this.m_swapStream.writeArrayBuffer(this.m_stream,this.m_stream.pos,remain_len);
            StateObject.writeBytes2(this.m_stream,this.m_swapStream,this.m_stream.pos,remain_len);
            this.m_swapStream.pos = 0;
        }
        this.m_stream.clear();
        this.m_stream.pos = 0;
        // this.m_stream.writeArrayBuffer(this.m_swapStream,0,this.m_swapStream.length);
        StateObject.writeBytes2(this.m_swapStream,this.m_stream,0,this.m_swapStream.length);
        this.m_stream.pos = 0;

        this.m_type = 0;
        this.m_bodyLength = 0;
        this.m_buffLength = 0;
        this.m_receiveBody = false;
    }

    p.clear = function(){
        this.m_stream = null;
        this.m_swapStream = null;
        this.m_buffer = null;
        this.m_buffLength = 0;
        this.m_bodyLength = 0;
        this.m_receiveBody = false;
    }

    StateObject.writeBytes2 = function (fromByte,toByte,offset,len) {
        fromByte.pos = offset;
        for (var i = offset; i < fromByte.length && i < (len +  offset); i++) {
            var rbyte = fromByte.getByte();
            toByte.writeByte(rbyte);
        }
    };
    return StateObject;
}());