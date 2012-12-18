module.exports = MemoryStore = function() {
    this.backing = {};
};

MemoryStore.prototype.get = function(key, cb) {
    process.nextTick(function() {
        cb(null, this.backing[key]);
    }.bind(this));
};

MemoryStore.prototype.set = function(key, value, cb) {
    process.nextTick(function() {
        this.backing[key] = value;
        cb();
    }.bind(this));
};