var express = require('express'),
    openport = require('openport'),
    request = require('request'),
    assert = require('assert'),
    testServer = require('./test-server')
    
    session = require('../lib/middleware');

var port;
var host;
var server;

before(function(done) {
    testServer({
        secret: 'testSecret'
    }, function(serverPort, serverInstance) {
        port = serverPort;
        host = 'http://localhost:' + port;
        server = serverInstance;
        done();
    });
});

after(function() {
    server.close();
});

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
                assert.equal(data, '{"cookie":{"maxAge":null},"testing":"123"}');
                done(err);
            });
        });
    });
    
    it('does not expose others sessions', function(done) {
        request(host + '/session', {jar: false}, function(err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(data, '{"cookie":{"maxAge":null}}');
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
    });
    
    it('does not create sessions when destroying sessions', function(done) {
        var jar = request.jar();
        request.post(host + '/destroy', {jar: jar}, function (err, resp, data) {
            assert.equal(resp.statusCode, 200);
            assert.equal(1, resp.headers['set-cookie'].length);
            done(err);
        });
    });
    
    describe('with time based session expiry', function() {
        var port, server, host;
        before(function(done) {
            testServer({
                secret: 'testSecret',
                maxAge: 1000 * 60 * 15 //15 mins
            }, function(serverPort, serverInstance) {
                port = serverPort;
                host = 'http://localhost:' + port;
                server = serverInstance;
                done();
            });
        });

        after(function() {
            server.close();
        });
        
        it('touches the session cookie on requests', function(done) {
            request(host + '/session', {}, function(err, resp, data) {
                assert.equal(resp.statusCode, 200);
                assert.equal(1, resp.headers['set-cookie'].length);
                assert.equal(0, resp.headers['set-cookie'][0].indexOf('sessionId=c'));
                
                request(host, {}, function(err, resp, data) {
                    assert.equal(resp.statusCode, 200);
                    assert.equal(1, resp.headers['set-cookie'].length);
                    assert.equal(0, resp.headers['set-cookie'][0].indexOf('sessionId=c'));
                    done(err);
                });
            });
        });
    });
});