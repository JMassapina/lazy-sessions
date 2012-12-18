# lazy-sessions

A simple middleware for express that is conservative about when it creates and fetches sessions. The connect-provided session middleware always creates a session and always reads it from the backing store upon every request. This middleware gives you control about when it creates sessions and when to retrieve the session from the store. This is useful when you have a backing store that requires a network hop to access.

## usage
Add as an express middleware:

    var express = require('express');
    var app = express();
    
    app.use(express.cookieParser());
    app.use(require('lazy-sessions')({
        secret: 'keyboard cat'
    }));

Once the middleware is mounted, it is available on the request object as `session`.

## api

`session.get(cb)`

Gets the session from the underlying store. Creates the session if it does not exist. Callback receives `err, data` as parameters. Once the response has been sent, we save the session data back to the underlying store automatically.

`session.clear(cb)`

Clears the session and removes the session cookie. Callback recieves `err` as parameter.

