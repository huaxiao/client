/*
* EventMgr;
*/
var EventMgr = (function (_super) {
    function EventMgr() {

    }

    EventMgr.getInstance = function () {
        if (EventMgr._instance == null) {
            EventMgr._instance = new EventMgr();
        }
        return EventMgr._instance;
    };

    Laya.class(EventMgr,"EventMgr",_super);

    return EventMgr;
}(laya.events.EventDispatcher));

EventMgr._instance = null;
