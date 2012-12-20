var express = require('express'),
    openport = require('openport'),
    session = require('../lib/middleware');

module.exports = function createServer(middlewareConfig, cb) {
    var app = express();
    app.use(express.cookieParser());
    app.use(session(middlewareConfig));
    
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
        
        var port = availablePort;
        var server = app.listen(port, function() {
            cb(port, server);
        });
    });
}