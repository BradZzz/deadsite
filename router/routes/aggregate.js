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

function resolvePromises (child) {
    var deferred = Q.defer()
    requestP({ uri: child.data.url, transform: function (body) {
        return { domain : child.data.domain, url : child.data.url, title : child.data.title, cheerio : cheerio.load(body) }
    }}).then(function(res){
        deferred.resolve(res)
    }).catch(function(err){
        deferred.resolve({ url: child.data.url, err : err })
    })
    return deferred.promise
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
                _.each(body.data.children, function(child){
                    rData.push({ url : child.data.url , title : child.data.title })
                    if (child.data.url.indexOf('reddit') === -1 && child.data.url.indexOf('i.imgur') === -1) {
                        promises.push(resolvePromises(child))
                    }
                })
                Q.all(promises).then(function(body) {
                  var attribs = []
                  _.each(body, function(meta){
                    if (!('err' in meta)){
                        var $ = meta.cheerio
                        var imgs = _.map($('img'), function (value, key) {
                          return value.attribs
                        })
                        var vids = _.map($('video'), function (value, key) {
                          return value.attribs
                        })

                        /*var h1 = _.filter(_.map($('h1'), function (value, key) {
                            var data = [value.attribs]
                            console.log('< ---- 1 ---- >')
                            console.log(getAll(value.children))
                            console.log('< ---- 2 ---- >')
                            console.log(data)
                            console.log('< ---- 3 ---- >')
                            //_.flatten(data,getAll(value.children))
                            return data
                        }),function(data){ return data })*/
                        //console.log(h1)
                        var h1 = []
                        _.each($('h1'), function (value, key) {
                            if (value.attribs) {
                                h1.push(value.attribs)
                            }
                            if (value.children.length > 0) {
                                console.log('< -- before -- >')
                                console.log(_.flatten(h1,getAll(value.children)))
                                h1 = _.flatten(h1,getAll(value.children))
                                console.log(h1)
                                console.log('< -- after -- >')
                            }
                        })

                        console.log('< -- done -- >')

                        console.log(h1)

                        var h2 = _.map($('h2'), function (value, key) {
                          return value.attribs
                        })
                        var h3 = _.map($('h3'), function (value, key) {
                          return value.attribs
                        })
                        var h4 = _.map($('h4'), function (value, key) {
                          return value.attribs
                        })
                        var span = _.map($('span'), function (value, key) {
                          return value.attribs
                        })
                        var p = _.map($('p'), function (value, key) {
                          return value.attribs
                        })

                        var item = { cat : req.query.params.replace(' ','+'), url : meta.url, urlTitle : $('title').text(),
                            title : meta.title, imgs : imgs, vids : vids, h1 : h1, h2 : h2, h3 : h3, h4 : h4, p : p, span : span }

                        attribs.push(item)
                    }
                  })
                  //console.log(attribs)
                  //cache.get = attribs
                  //addAll(attribs).then(function(data){ return res.status(200).json(data) })
                }, function(err) {
                  console.log(err)
                  return res.status(500).json(err)
                })
            })
        } else {
           return res.status(400).json('Bad Request')
        }
    })

    function getAll(children){
        var data = []
        console.log('getAll')
        _.each(children, function(child){
            if (child.attribs) {
                data.push(child.attribs)
            }
            //if (child.children.length > 0) {
            //    data = _.flatten(data, getAll(child.children))
            //}
        })
        return data
    }

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
                console.log(req.query.params.replace(' ','+'))
                Site.find({
                  'cat': req.query.params.replace(' ','+'),
                }, function(err, links) {
                    console.log(err)
                    console.log(links)
                    if (err) {
                        return res.status(500).json(err)
                    }
                    return res.status(200).json(links)
                })
            } else {
               return res.status(400).json('Bad Request')
            }
        }
    })
}
