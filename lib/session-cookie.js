var _ = require('underscore'),
    cuid = require('cuid');

module.exports = SessionCookie = function(options) {
    if (options.secret == null) {
        throw new Error("'secret' property is required");
    }
    
    this.options = _.defaults(options, {
        cookieName: 'sessionId'
    });
};

SessionCookie.prototype.create = function(req, res) {
    var sessionId = cuid();
    
    var cookieOptions = {};
    if(this.options.maxAge != null) {
        cookieOptions.expires = new Date(Date.now() + this.options.maxAge);
    }
    
    res.cookie(this.options.cookieName, sessionId, cookieOptions);
    return sessionId;
};

SessionCookie.prototype.destroy = function(req, res) {
    res.clearCookie(this.options.cookieName);
};

SessionCookie.prototype.touch = function(req, res) {
    var cookie = req.cookies[this.options.cookieName];
    if (cookie != null && this.options.maxAge != null) {
        var cookieOptions = {
            expires: new Date(Date.now() + this.options.maxAge)
        };
        res.cookie(this.options.cookieName, cookie, cookieOptions);
    }
};

SessionCookie.prototype.get = function(req) {
    return req.cookies[this.options.cookieName];
};

SessionCookie.prototype.exists = function(req) {
    return req.cookies[this.options.cookieName] != null;
};