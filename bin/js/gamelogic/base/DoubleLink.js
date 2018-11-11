/*
* 双向链表节点;
*/
var DoubleLinkNode = (function(){
    function DoubleLinkNode(data) {
        this.m_data = data || null;
    }

    var p = DoubleLinkNode.prototype;

    p.getData = function() {
        return this.m_data;
    }

    p.setData = function(data) {
        this.m_data = data;
    }

    p.isAttach = function(){
        return this.m_pre!=null;
    }

    p.detach = function(){
        if(this.m_pre!=null) {
            this.m_pre.m_next = this.m_next;
            this.m_next.m_pre = this.m_pre;
            this.m_pre = null;
            this.m_next = null;
        }
    }

    return DoubleLinkNode;
}());

/*
* 双向链表;
*/
var DoubleLink = (function () {
    function DoubleLink() {
        this.m_root = new DoubleLinkNode();        
        this.init();
    }

    var p = DoubleLink.prototype;    

    p.init = function() {
        this.m_count = 0;
        _link(this.m_root,this.m_root);
    }

    p.next = function(node) {
        return node.m_next;
    }

    p.pre = function(node) {
        return node.m_pre;
    }

    p.pushAfter = function(beforeNode,node) {
        node.detach();
        _pushAfter(beforeNode,node);
        this.m_count ++;
    }

    p.pushBefore = function(afterNode,node) {
        node.detach();
        _pushBefore(afterNode,node);
        this.m_count ++;
    }

    p.pushLinkAfter = function(beforeNode,list) {
        if(beforeNode.isAttach()==false || list.isEmpty()) return;
        _pushLinkBefore(beforeNode,list);
        this.m_count += list.getCount();
    }

    p.pushLinkBefore = function(afterNode,list) {
        if(afterNode.isAttach()==false || list.isEmpty()) return;
        _pushLinkBefore(afterNode,list);
        this.m_count += list.getCount();
    }

    p.isEmpty = function() {
        return this.m_root.m_next == this.m_root;
    }

    p.isNotEmpty = function() {
        return this.m_root.m_next != this.m_root;
    }

    p.getCount = function() {
        return this.m_count;
    }

    p.contain = function(node) {
        if(!node.isAttach()) {
            return false;
        }
        var next = this.m_root.m_next;
        while (next != this.m_root) {
            if (next == node) {
                return true;
            }
            next = next.m_next;
        }
        return false;
    }

    p.isEnd = function(node) {
        return node == this.m_root;
    }

    p.getHead = function() {
        return this.m_root.m_next;
    }

    p.getTail = function() {
        return this.m_root.m_pre;
    }

    p.pushBack = function(node) {
        node.detach();
        _pushBefore(this.m_root,node);
        this.m_count ++;
    }

    p.pushFront = function(node) {
        node.detach();
        _pushAfter(this.m_root,node);
        this.m_count ++;
    }

    p.pushLinkBack = function(list) {
        _pushLinkBefore(this.m_root,list);
        this.m_count += list.getCount();
    }

    p.pushLinkFront = function(list) {
        _pushLinkAfter(this.m_root,list);
        this.m_count += list.getCount();
    }

    p.setDate = function(data) {
        var next = this.m_root.m_next;
        while(next != this.m_root) {
            next.setData(data);
            next = next.m_next;
        }
    }

    p.clear = function() {
        var next = this.m_root.m_next;
        while(next!=this.m_root) {
            var nextCopy = next.m_next;
            next.m_pre = null;
            next.m_next = null;
            next.m_data = null;
            next = nextCopy;
        }
        this.init();
    }

    /////////////////////////////////////////////////////////////////////////////////

    function _link(preNode,nextNode) {
        preNode.m_next = nextNode;
        nextNode.m_pre = preNode;
    }
    function _pushAfter(beforeNode,node) {
        var next = beforeNode.m_next;
        _link(beforeNode,node);
        _link(node,next);
    }
    function _pushBefore(afterNode,node) {
        var pre = afterNode.m_pre;
        _link(pre,node);
        _link(node,afterNode);
    }
    function _pushLinkAfter(beforeNode,list) {
        if(list.isEmpty()) return;
        var first = list.m_root.m_next;
        var back = list.m_root.m_pre;
        var next = before.m_next;
        _link(beforeNode,first);
        _link(back,next);
        list.init();
    }
    function _pushLinkBefore(afterNode,list) {
        if(list.isEmpty()) return;
        var first = list.m_root.m_next;
        var back = list.m_root.m_pre;
        var pre = afterNode.m_pre;
        _link(pre,first);
        _link(back,after);
        list.init();
    }

    return DoubleLink;
}());

/**
 * for use case
 * 
 */
// var list = new DoubleLink();
// var node1 = new DoubleLinkNode();
// node1.setData(1);
// var node2 = new DoubleLinkNode(2);
// list.pushBack(node1);
// list.pushBack(node2);
// for (var iter = list.getHead(); !list.isEnd(iter); iter = list.next(iter)) {
//     console.log(iter.getData());
// }