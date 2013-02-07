var SessionCookie = require('./session-cookie'),
    Session = require('./session'),
    MemoryStore = require('./store/memory');

module.exports = function(options) {
    var cookie = new SessionCookie(options);
    var store = options.store || new MemoryStore();
    
    return function(req, res, next) {
        var getter;
        var destroySession = req.destroySession = function(cb) {
            cookie.destroy(req, res);
            if(cb) {
                process.nextTick(cb);
            }
        };
        
        res.on('header', function() {
            if(!cookie.hasBeenSet(res)) {
                cookie.touch(req, res);
            }
        });
        
        if (cookie.exists(req)) {
            var sessionId;
            try {
                sessionId = cookie.get(req);
            } catch (err) {
                cookie.destroy(req, res);
                return next(err);
            }
            var session = new Session(sessionId, store, options.maxAge);
            req.destroySession = function(cb) {
                session.clear(cb);
            };
            session.once('destroy', destroySession);
            getter = function() { 
                req._session = session;
                return session; 
            };
        } else {
            getter = function() {
                if(req._session) {
                    return req._session;
                }
                
                var sessionId = cookie.create(req, res);
                var session = new Session(sessionId, store, options.maxAge);
                session.once('destroy', req.destroySession);
                req._session = session;
                return session;
            };
        }
        
        req.__defineGetter__('session', getter);
        
        var end = res.end;
        res.end = function(data, encoding) {
            res.end = end;
            
            //cookie does not exist if session has just been created
            //so check for req._session as well
            if(cookie.exists(req) || req._session) {
                req.session.save(function(err) {
                    res.end(data, encoding);
                });
            } else {
                res.end(data, encoding);
            }
        };
        
        next();
    };
};