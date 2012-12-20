# lazy-sessions

A simple middleware for express that is conservative about when it creates and fetches sessions. The connect-provided session middleware always creates a session and always reads it from the backing store upon every request. This middleware gives you control about when it creates sessions and when to retrieve the session from the store. This is useful when you have a backing store that requires a network hop to access.

## installation
    npm install lazy-sessions

## usage
Add as an express middleware:

    var express = require('express');
    var app = express();
    
    app.use(express.cookieParser());
    app.use(require('lazy-sessions')({
        secret: 'keyboard cat', //required, secret to sign cookies with
        maxAge: 1000 * 60 * 30, //cookie max age in ms, default is null which creates a browser-session cookie
        store: myCustomStore //plug in your own store implementations, defaults to an in memory store
    }));

Once the middleware is mounted, it is available on the request object as `session`.

## api

`session.get(cb)`

Gets the session from the underlying store. Creates the session if it does not exist. Callback receives `err, data` as parameters. Once the response has been sent, we save the session data back to the underlying store automatically.

`session.clear(cb)`

Clears the session and removes the session cookie. Callback recieves `err` as parameter.

## session stores

Existing connect session store implementations can be used, or you can create your own. The store must implement:

- `.get(sid, callback)`
- `.set(sid, session, callback)`
- `.destroy(sid, callback)`

If stores use the maxAge property of the session cookie to do expiration of session data, they should also implement a touch function. This is used when a request with an associated session is received, but the session data is unchanged. This function is optional.

- `.touch(sid, sessionDuration, callback)`

