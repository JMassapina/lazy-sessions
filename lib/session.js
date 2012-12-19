var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    crypto = require('crypto');
    
module.exports = Session = function(sessionId, store) {
    EventEmitter.call(this);
    this.sessionId = sessionId;
    this.store = store;
    this.localData = {};
};
util.inherits(Session, EventEmitter);

function hash(obj) {
    var hash = crypto.createHash('md5');
    hash.update(JSON.stringify(obj));
    return hash.digest();
}

Session.prototype.get = function(cb) {
    this.store.get(this.sessionId, function(err, data) {
        if (err) {
            return cb(err);
        }
        
        if (data == null) {
            data = {};
        }
        
        this.localData = data;
        this.originalHash = hash(data);
        
        cb(null, this.localData);
    }.bind(this));
    
};

Session.prototype.save = function(cb) {
    var newHash = hash(this.localData);
    
    if (newHash === this.originalHash) {
        cb();
    } else {
        this.store.set(this.sessionId, this.localData, function(err) {
            if (cb != null) {
                cb(err);
            }
        });
    }
};

Session.prototype.clear = function(cb) {
    this.store.destroy(this.sessionId, function(err) {
        this.emit('destroy');
        if (cb != null) {
            cb(err);
        }
    }.bind(this));
}