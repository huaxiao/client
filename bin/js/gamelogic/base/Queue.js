/**
 * [Queue]
 * @param {[Int]} size [队列大小]
 */
function Queue(size) {
    var list = [];

    //向队列中添加数据
    this.push = function(data) {
        if (data==null) {
            return false;
        }
        //如果传递了size参数就设置了队列的大小
        if (size != null && !isNaN(size)) {
            if (list.length == size) {
                this.pop();
            }
        }
        list.unshift(data);
        return true;
    }

    //从队列尾部中取出数据
    this.pop = function() {
        return list.pop();
    }

    //从队列头部中取出数据
    this.shift = function() {
        return list.shift();
    }

    //返回队列的大小
    this.size = function() {
        return list.length;
    }

    //返回队列的内容
    this.quere = function() {
        return list;
    }

    //清空队列的内容
    this.clear = function(){
        while(list.length > 0){
            this.pop();
        }
    }
}