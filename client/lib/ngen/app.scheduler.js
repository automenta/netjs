window.app = window.app || {};

(function(ns){
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var scheduler = function() {
        var that;
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = ns.eventful();
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _ticks = 0;
        var _maxTicks = 1000000;
        var _tasks = [];
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.tasks = _tasks;
        
        that.tick = function() {
            _ticks++;
            if (_ticks > _maxTicks) _ticks = 1;
            
            var len = _tasks.length;
            for (var i = 0; i < len; i++) {
                var task = _tasks[i];
                if (!task) continue;
                
                if (task.ticks == 0) task.triggerEvent('start');
                
                task.ticks++;
                if (task.last <= task.ticks - task.skip) {
                    var result = task.exec.apply(task);
                    task.last = task.ticks;
                    
                    if (result === false) {
                        _tasks.splice(i, 1);
                        i--;
                        task.triggerEvent('end');
                    }
                }
            }
        };
        
        that.addTask = function(spec) {
            var task = ns.eventful();
            
            task.name = spec.name;
            task.type = spec.type;
            task.exec = spec.exec;
            task.skip = spec.skip || 0;
            task.cancel = spec.cancel;
            
            task.last = 0;
            task.ticks = 0;
            
            _tasks.push(task);
            return task;
        };
        
        that.getTaskByName = function(name) {
            var len = _tasks.length;
            for (var i = 0; i < len; i++) {
                var task = _tasks[i];
                if (task.name == name) return task;
            }
            return null;
        };

        that.getTasksByType = function(type) {
            var found = [];
            var len = _tasks.length;
            for (var i = 0; i < len; i++) {
                var task = _tasks[i];
                if (task.type == type) found.push(task);
            }
            return found;
        };
        
        that.stopTask = function(task) {
            var index = null;
            var len = _tasks.length;
            for (var i = 0; i < len; i++) {
                var t = _tasks[i];
                if (task == t) {
                    index = i;
                    break;
                }
            }
            
            if (index === null) return;
            
            _tasks.splice(index, 1);
        };
        
        that.cancelTask = function(task) {
            // TODO
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    ns.runtime singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.scheduler = scheduler();
        
})(window.app);