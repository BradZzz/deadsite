/***
nasdaq stocks
http://www.nasdaq.com/screening/companies-by-industry.aspx?exchange=NASDAQ&render=download
nyse stocks
http://www.nasdaq.com/screening/companies-by-industry.aspx?exchange=NYSE&render=download
asx stocks
http://www.asx.com.au/asx/research/ASXListedCompanies.csv
***/

require('dotenv').load()

var Q         = require('q')
var _         = require('underscore')
var request   = require('request')
var requestP  = require('request-promise')
var cheerio   = require('cheerio')

var Site    = require('../../models/site')

var cache = {}

String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

module.exports = function (app) {

    app.get('/agg/update', function (req, res) {
        if ('params' in req.query) {
            var url = 'https://www.reddit.com/r/' + req.query.params.replace(' ','+') + '/new.json?sort=hot&limit=100'
            request(url, function(error, response, html){
                if (error) {
                    return res.status(500).json(error)
                }
                var rData = []
                var promises = []
                var body = JSON.parse(response.body)
                console.log(body.data.children)
                console.log('< ------------ done init --------------- >')
                _.each(body.data.children, function(child){
                    rData.push({ url : child.data.url , title : child.data.title })
                    if (child.data.url.indexOf('reddit') === -1 && child.data.url.indexOf('i.imgur') === -1) {
                        promises.push(requestP({ uri: child.data.url, transform: function (body) {
                            return { domain : child.data.domain, url : child.data.url, title : child.data.title, cheerio : cheerio.load(body) }
                        } }))
                    }
                })
                Q.all(promises).then(function(body) {
                  var attribs = []
                  _.each(body, function(meta){
                    var $ = meta.cheerio
                    var imgs = _.map($('img'), function (value, key) {
                      return value.attribs
                    })
                    var vids = _.map($('video'), function (value, key) {
                      return value.attribs
                    })
                    var item = { cat : req.query.params.replace(' ','+'), url : meta.url, urlTitle : $('title').text(), title : meta.title, imgs : imgs, vids : vids }
                    attribs.push(item)
                  })
                  cache.get = attribs
                  addAll(attribs).then(function(data){ return res.status(200).json(data) })
                }, function(err) {
                  return res.status(500).json(err)
                })
            })
        } else {
           return res.status(400).json('Bad Request')
        }
    })

    function addAll(items){
        var deferred = Q.defer()
        var promises = []
        Q.all(_.map(items,function(item){
            return promises.push(Site.findOneAndUpdate({ cat : item.cat, url : item.url }, item, {upsert:true, new:true}, function(err, dat){
              console.log('Returned')
              if (err) {
                console.log(err)
              }
              console.log(dat)
            }))
        })).then(function(body) {
              deferred.resolve(body)
        })
        return deferred.promise
    }

    app.get('/agg/get', function (req, res) {
        if ('get' in cache) {
            return res.status(200).json(cache.get)
        } else {
            if ('params' in req.query) {
                var url = 'https://www.reddit.com/r/' + req.query.params.replace(' ','+') + '/new.json?sort=hot&limit=100'
                console.log(url)
                //var url = 'https://www.reddit.com/r/gifs+reallifedoodles/new.json?sort=new&limit=20'
                request(url, function(error, response, html){
                    if (error) {
                        return res.status(500).json(error)
                    }
                    var rData = []
                    var promises = []
                    var body = JSON.parse(response.body)
                    console.log(body.data.children)
                    console.log('< ------------ done init --------------- >')
                    _.each(body.data.children, function(child){
                        rData.push({ url : child.data.url , title : child.data.title })
                        if (child.data.url.indexOf('reddit') === -1 && child.data.url.indexOf('i.imgur') === -1) {
                            promises.push(requestP({ uri: child.data.url, transform: function (body) {
                                return { domain : child.data.domain, url : child.data.url, title : child.data.title, cheerio : cheerio.load(body) }
                            } }))
                        }
                    })
                    Q.all(promises).then(function(body) {
                      var attribs = []
                      _.each(body, function(meta){
                        var $ = meta.cheerio
                        var imgs = _.map($('img'), function (value, key) {
                          return value.attribs
                        })
                        console.log($('title').text())
                        attribs.push({ cat : req.query.params.replace(' ','+'), url : meta.url, urlTitle : $('title').text(), title : meta.title, imgs : imgs })
                      })
                      cache.get = attribs
                      return res.status(200).json(attribs)
                    }, function(err) {
                      return res.status(500).json(err)
                    })
                })
            } else {
               return res.status(400).json('Bad Request')
            }
        }
    })
}
