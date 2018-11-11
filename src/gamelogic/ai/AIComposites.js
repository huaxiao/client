// var b3 = require('../3rd/behavior3');

/*
* SequenceWithRunning
*/
(function(){
    var SequenceWithRunning = b3.Class(b3.Composite);
    var p = SequenceWithRunning.prototype;
    p.name = 'SequenceWithRunning';

    p.tick = function(tick) {
        for (var i=0; i<this.children.length; i++) {
            var status = this.children[i]._execute(tick);

            ///&& status != b3.RUNNING
            // if (status !== b3.SUCCESS ) {
            //     return status;
            // }
            
            if (status != b3.SUCCESS && status != b3.RUNNING) {
                return status;
            }
        }

        return b3.SUCCESS;
    }

    b3.SequenceWithRunning = SequenceWithRunning;
})();