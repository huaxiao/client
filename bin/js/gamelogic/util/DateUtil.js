/*
* name;
*/
var DateUtil = (function () {
    function DateUtil() {
    }

    DateUtil.getCurrentTimeStamp = function(){
        return Date.now();
    }
    return DateUtil;
}());