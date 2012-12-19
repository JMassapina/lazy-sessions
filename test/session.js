var Session = require('../lib/session'),
    assert = require('assert'),
    sinon = require('sinon');

describe('Session', function() {
    var spy, store;
    
    beforeEach(function() {
        spy = sinon.spy();
        store = {
            set: function(key, value, cb) {
                spy();
                cb();
            },
            get: function(key, cb) {
                cb();
            },
            destroy: function(key, cb) {
                cb();
            }
        };
    });
    afterEach(function() {
        spy.reset();
    });
    
    describe('#save()', function() {
        it('calls save on the store', function(done) {
            var testObj = new Session('sessionId', store);
            
            testObj.get(function(err, data) {
                data.test = 'value';
                testObj.save(function() {
                    assert(spy.called);
                    done();
                });
            })
        });
        
        it('does not call save on the store when the session data is unchanged', function(done) {
            var testObj = new Session('sessionId', store);
            
            testObj.get(function(err, data) {
                testObj.save(function() {
                    assert(!spy.called);
                    done();
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
})