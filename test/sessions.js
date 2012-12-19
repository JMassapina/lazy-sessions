var express = require('express'),
    openport = require('openport'),
    request = require('request'),
    assert = require('assert')
    
    session = require('../lib/middleware');

var port;
var host;
var server;
before(function(done) {
    var app = express();
    app.use(express.cookieParser());
    app.use(session({
        secret: 'testSecret'
    }));
    
    app.get('/', function(req, res) {
        res.send(200);
    });
    
    app.get('/session', function(req, res) {
        req.session.get(function(err, data) {
            if (err) return res.send(500);
            
            res.json(data);
        });
    });
    
    app.post('/store', function(req, res) {
        req.session.get(function(err, data) {
            if (err) return res.send(500);
            
            data.testing = '123';
            res.send(200);
        });
    });
    
    app.post('/destroy', function(req, res) {
        req.session.clear(function(err) {
            if (err) return res.send(500);
            
            res.send(200);
        });
        
    });
    
    openport.find({
        startingPort: 8000,
        endingPort: 9000
    }, function(err, availablePort) {
        if (err) {
            return done(err);
        }
        
        port = availablePort;
        host = 'http://localhost:' + port;
        server = app.listen(port, function() {
            console.log('server started on port ' + port);
            done();
        });
    });
});

after(function() {
    console.log('server closing');
    server.close();
})

describe('lazy-sessions', function() {
    it('does not create sessions on first request', function(done) {
        request(host + '/', {}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(resp.headers['set-cookie'], undefined);
            done(err);
        });
    });
    
    it('creates sessions correctly', function(done) {
        request(host + '/session', {}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(1, resp.headers['set-cookie'].length);
            assert.equal(0, resp.headers['set-cookie'][0].indexOf('sessionId=c'));
            done(err);
        });
    });
    
    it('stores data between requests in a sesions', function(done) {
        request.post(host + '/store', {}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            
            request(host + '/session', {}, function(err, resp, data) {
                assert.equal(resp.statusCode, 200);
                assert.equal(data, '{\n  "cookie": {\n    "maxAge": null\n  },\n  "testing": "123"\n}');
                done(err);
            });
        });
    });
    
    it('does not expose others sessions', function(done) {
        request(host + '/session', {jar: false}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(data, '{\n  "cookie": {\n    "maxAge": null\n  }\n}');
            done(err);
        });
    });
    
    it('rejects tampered session cookies', function(done) {
        var jar = request.jar();
        request.post(host + '/store', {jar: jar}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            
            var cookie = request.cookie(resp.headers['set-cookie'][0]);
            var parts = cookie.value.split('.');
            parts[0] = 'nonsense';
            cookie.value = parts.join('.');
            
            jar.add(cookie);
            
            request(host + '/session', {jar: jar}, function(err, resp, data) {
                assert.equal(resp.statusCode, 500);
                assert.equal(1, resp.headers['set-cookie'].length);
                assert.equal('sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT', resp.headers['set-cookie'][0]);
                done(err);
            });
            
        });
    });
    
    it('destroys sessions correctly', function(done) {
        request.post(host + '/destroy', {}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(1, resp.headers['set-cookie'].length);
            assert.equal('sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT', resp.headers['set-cookie'][0]);
            done(err);
        });
    })
});