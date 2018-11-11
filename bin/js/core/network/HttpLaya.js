/*
* HttpLaya Http连接;
*/
var HttpLaya = (function () {
    function HttpLaya(httpCallback) {
        this.httpCallback = httpCallback;
        this.url = "";
        this.http = new Laya.HttpRequest();
        this.http.timeout = 10000;
        this.http.once(Laya.Event.PROGRESS, this, this.onHttpRequestProgress);
        this.http.once(Laya.Event.COMPLETE, this, this.onHttpRequestComplete);
        this.http.once(Laya.Event.ERROR, this, this.onHttpRequestError);
    }
    HttpLaya.prototype.sendPost = function (loginUrl,pars, type) {
        var par = this.parsToStr(pars);
        this.url = loginUrl + "/" + type;
        this.http.send(this.url, par, 'post', 'json');
    };
    HttpLaya.prototype.sendGet = function (loginUrl,pars) {
        var par = this.parsToStr(pars);
        this.url = loginUrl + "?" + par;
        this.http.send(this.url, null, 'get', 'json');
    };
    
    HttpLaya.prototype.sendGetWithUrl = function (url) {
        this.url = url;
        this.http.send(url, null, 'get', 'json');
    };
    
    HttpLaya.prototype.sendPostWithUrl = function (url,par,responseType) {
        this.url = url;
        this.http.send(url, par, 'post', responseType || 'json');
    };

    HttpLaya.prototype.parsToStr = function (pars) {
        var par = "";
        for (var i = 0; i < pars.length; i++) {
            par += pars[i][0] + "=" + pars[i][1];
            if (i < pars.length - 1) {
                par += "&";
            }
        }
        // console.log("par:", par);
        return par;
    };
    HttpLaya.prototype.onHttpRequestProgress = function (e) {
        // console.log(e);
    };
    HttpLaya.prototype.onHttpRequestComplete = function (e) {
        // console.log(this.http.data);
        if (this.httpCallback) {
            this.httpCallback(null, this.http.data);
        }
    };
    HttpLaya.prototype.onHttpRequestError = function (e) {
        console.error(e+" url:"+this.url);
        if (this.httpCallback) {
            this.httpCallback(e, null);
        }
    };
    return HttpLaya;
}());