var fs              = require('fs')
var Q               = require('q')
var _               = require('underscore')
var LocalStrategy   = require('passport-local').Strategy
var User            = require('../../models/user')
var passport        = require('passport')

var cache = {}

module.exports = function (app) {

  app.post('/login',passport.authenticate('local', {
    successRedirect: '/loginSucceed',
    failureRedirect: '/loginFail'
  }))

  app.get('/logout', function(req, res){
    req.logout();
    return res.status(200).json('Successfully logged out!')
  })

  app.post('/register', function(req, res) {
    var body = req.body
    var instance = new User();
    if ( 'email' in body && 'pass' in body && 'type' in body ) {
      instance.email = instance.name = body.email
      instance.pass = instance.generateHash(body.pass)
      instance.type = body.type
      if ( 'role' in body ) { instance.role = body.role }
      if ( 'token' in body ) { instance.token = body.token }
      User.findOne({
        'email': instance.email,
      }, function(err, user) {
        if (err) {
          return res.status(500).json({ err: err })
        }
        if (!user) {
          instance.save(function (err, person) {
            if (err) {
              return res.status(500).json({ err: err })
            }
            req.login(person, function(err) {
              if (err) { return next(err) }
              return res.status(200).json({ user: person.clientUser(), status: 'Registration successful!' })
            })
          })
        } else {
          return res.status(400).json({ err: 'User already exists' })
        }
      })
    } else {
      return res.status(400).json("Bad Request")
    }
  })

  passport.use(new LocalStrategy(function(username, password, done) {
    process.nextTick(function() {
      User.findOne({
        'email': username,
      }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!user.validPassword(password)) {
          return done(null, false)
        }
        return done(null, user)
      })
    })
  }))

  app.get('/loginFail', function(req, res, next) {
    return res.status(400).json('Failed to authenticate')
  })

  app.get('/loginSucceed', function(req, res, next) {
    return res.status(200).json({ user: req.user.clientUser(), status: 'Registration successful!' })
  })

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  })

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  })
}
