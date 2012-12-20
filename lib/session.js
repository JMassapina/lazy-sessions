var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    crypto = require('crypto');
    
module.exports = Session = function(sessionId, store, maxAge) {
    EventEmitter.call(this);
    this.sessionId = sessionId;
    this.store = store;
    this.maxAge = maxAge || Infinity;
};
util.inherits(Session, EventEmitter);

function hash(obj) {
    if (obj == null) {
        return undefined;
    }
    
    var hash = crypto.createHash('md5');
    hash.update(JSON.stringify(obj));
    return hash.digest();
}

Session.prototype.get = function(cb) {
    if (this.localData != null) {
        cb(null, this.localData);
        return;
    }
    
    this.store.get(this.sessionId, function(err, data) {
        if (err) {
            return cb(err);
        }
        
        if (data == null) {
            data = {
                cookie: {
                    maxAge: this.maxAge
                }
            };
        }
        
        this.localData = data;
        this.originalHash = hash(data);
        
        cb(null, this.localData);
    }.bind(this));
    
};

Session.prototype.save = function(cb) {
    var newHash = hash(this.localData);
    
    if (newHash === this.originalHash) {
        if (this.store.touch && this.maxAge !== Infinity) {
            this.store.touch(this.sessionId, this.maxAge, cb);
        } else {
            cb();
        }
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