var _ = require('underscore'),
    signature = require('cookie-signature'),
    cookie = require('cookie'),
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
    var signed = signature.sign(sessionId, this.options.secret);
    
    var cookieOptions = {};
    if(this.options.maxAge != null) {
        cookieOptions.expires = new Date(Date.now() + this.options.maxAge);
    }
    
    res.cookie(this.options.cookieName, signed, cookieOptions);
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
    var signed = req.cookies[this.options.cookieName];
    if (signed != null) {
        var unsigned = signature.unsign(signed, this.options.secret);
        
        if (unsigned === false) {
            throw new Error('Cookie was tampered with');
        }
        
        return unsigned;
    }
};

SessionCookie.prototype.hasBeenSet = function(res) {
    var setCookies = res.getHeader('set-cookie');
    if(setCookies != null) {
        if(_.isArray(setCookies)) {
            setCookies = setCookies.join(', ');
        }
        
        var parsed = cookie.parse(setCookies);
        if(parsed[this.options.cookieName] != null) {
            return true;
        }
    }
    return false;
};

SessionCookie.prototype.exists = function(req) {
    return req.cookies[this.options.cookieName] != null;
};