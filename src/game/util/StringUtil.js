/*
* name;
*/
var StringUtil = (function () {
    function StringUtil() {
    }

    StringUtil.format = function(content,args){
        var result = content;
        if(args.length == undefined){
            var re = new RegExp('\\{' + 0 + '\\}', 'gm');
            result = result.replace(re, args);
        }else
        {
            for (var i = 0; i < args.length; i++) {
                var re = new RegExp('\\{' + i + '\\}', 'gm');
                result = result.replace(re, args[i]);
            }
        }
       
        return result;
    }

    StringUtil.formatSeconds = function(second){
        var h = 0,m = 0;
        if(second > 60) { 
            m = parseInt(second/60); 
            second = parseInt(second%60);
            if(m > 60) { 
                h = parseInt(m/60); 
                m = parseInt(m%60); 
            } 
        } 
        var result = ""+parseInt(second)+"秒"; 
        if(m > 0) { 
            result = ""+parseInt(m)+"分"+result; 
        } 
        if(h > 0) { 
            result = ""+parseInt(h)+"小时"+result; 
        } 
        return result; 
    }

    StringUtil.getFormatSeconds = function(second,split){
        var h = 0,m = 0,result;
        if(second > 60) { 
            m = parseInt(second/60); 
            second = parseInt(second%60);
            if(m > 60) { 
                h = parseInt(m/60); 
                m = parseInt(m%60); 
            } 
        } 

        if(h >= 10){
            result = h+":";
        }else{
            result = "0"+h+":";
        }

        if(m >= 10){
            result += m+":";
        }else{
            result += "0"+m+":";
        }

        if(second >= 10){
            result += second+"";
        }else{
            result += "0"+second+"";
        }
        
        return result; 
    }

    return StringUtil;
}());
