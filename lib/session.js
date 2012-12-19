var EventEmitter = require('events').EventEmitter,
    util = require('util');
module.exports = Session = function(sessionId, store) {
    EventEmitter.call(this);
    this.sessionId = sessionId;
    this.store = store;
    this.localData = {};
};
util.inherits(Session, EventEmitter);

Session.prototype.get = function(cb) {
    this.store.get(this.sessionId, function(err, raw) {
        if (err) {
            return cb(err);
        }
        
        var data = null;
        if (raw != null) {
            try {
                data = JSON.parse(raw);
            } catch (err) {
                return cb(err);
            }
        } else {
            data = {};
        }
        
        this.localData = data;
        cb(null, this.localData);
    }.bind(this));
    
};

Session.prototype.save = function(cb) {
    try {
        var raw = JSON.stringify(this.localData);
        this.store.set(this.sessionId, raw, function(err) {
            cb(err);
        });
    } catch (err) {
        return cb(err);
    }
};

Session.prototype.clear = function(cb) {
    this.store.destroy(this.sessionId, function(err) {
        this.emit('destroy');
        cb(err);
    }.bind(this));
}