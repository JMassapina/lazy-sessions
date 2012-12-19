module.exports = MemoryStore = function() {
    this.backing = {};
};

MemoryStore.prototype.get = function(key, cb) {
    process.nextTick(function() {
        var raw = this.backing[key];
        if (raw == null) {
            return cb(null, null);
        }
        
        try {
            cb(null, JSON.parse(raw));
        } catch (err) {
            cb(err);
        }
        
    }.bind(this));
};

MemoryStore.prototype.set = function(key, value, cb) {
    process.nextTick(function() {
        try {
            this.backing[key] = JSON.stringify(value);
            cb();
        } catch (err) {
            cb(err);
        }
    }.bind(this));
};

MemoryStore.prototype.destroy = function(key, cb) {
    this.set(key, null, cb);
};