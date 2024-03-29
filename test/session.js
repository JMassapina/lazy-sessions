var Session = require('../lib/session'),
    assert = require('assert'),
    sinon = require('sinon');

describe('Session', function() {
    var spies = {}, store;
    
    beforeEach(function() {
        spies.set = sinon.spy();
        spies.touch = sinon.spy();
        spies.get = sinon.spy();
        store = {
            set: function(key, value, cb) {
                spies.set();
                cb();
            },
            get: function(key, cb) {
                spies.get();
                cb();
            },
            destroy: function(key, cb) {
                cb();
            },
            touch: function(key, sessionDuration, cb) {
                spies.touch();
                cb();
            }
        };
    });
    afterEach(function() {
        for (var spy in spies) {
            spies[spy].reset();
        }
    });
    
    describe('#save()', function() {
        it('calls save on the store', function(done) {
            var testObj = new Session('sessionId', store);
            
            testObj.get(function(err, data) {
                data.test = 'value';
                testObj.save(function() {
                    assert(spies.set.called);
                    done(err);
                });
            })
        });
        
        it('does not call save on the store when the session data is unchanged', function(done) {
            var testObj = new Session('sessionId', store);
            
            testObj.get(function(err, data) {
                testObj.save(function() {
                    assert(!spies.set.called);
                    done(err);
                });
            })
        });
        
        it('calls touch on the store when the session data is unchanged and maxAge is defined', function(done) {
            var testObj = new Session('sessionId', store, 9000000);
            
            testObj.get(function(err, data) {
                testObj.save(function() {
                    assert(spies.touch.called);
                    done(err);
                });
            })
        });
    });
    
    describe('#clear()', function() {
        it('emits a destroy event once the session store destroys the data', function(done) {
            var testObj = new Session('sessionId', store);
            testObj.once('destroy', done);
            testObj.clear();
        });
    });
    
    describe('#get()', function() {
        it('only contacts the session store once and then caches the result', function(done) {
            var testObj = new Session('sessionId', store);
            testObj.get(function(err, data) {
                if (err) {
                    return done(err);
                }
                
                testObj.get(function(err, data) {
                    assert(spies.get.calledOnce);
                    done(err);
                });
            })
        });
    });
})