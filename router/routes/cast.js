/***
nasdaq stocks
http://www.nasdaq.com/screening/companies-by-industry.aspx?exchange=NASDAQ&render=download
nyse stocks
http://www.nasdaq.com/screening/companies-by-industry.aspx?exchange=NYSE&render=download
asx stocks
http://www.asx.com.au/asx/research/ASXListedCompanies.csv
***/

require('dotenv').load()

var Q        = require('q')
var _        = require('underscore')
var request  = require('request')
var Media    = require('../../models/media')
var omdbApi = require('omdb-client')

var AWS = require('aws-sdk')
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

module.exports = function (app) {

    app.get('/cast/media/static', function (req, res) {
      return res.status(200).json({ pre : process.env.MEDIA_PREFIX, post : process.env.MEDIA_POSTFIX })
    })

    app.get('/cast/media/episode', function (req, res) {
        console.log(req.query)
        if ('name' in req.query && 'season' in req.query && 'episode' in req.query) {
            var params = {
                title: req.query.name.replace(/_/g, '+').capitalize(),
                season: req.query.season,
                episode: req.query.episode
            }
            omdbApi.get(params, function(err, data) {
                if (err) {
                  console.log(err)
                  return res.status(500).json(err)
                } else {
                  return res.status(200).json(data)
                }
            })
        } else {
            return res.status(400).json("Request doesn't contain all necessary parameters")
        }
    })

        function requestMeta(media) {
            var deferred = Q.defer()
            console.log(media)
            var params = {
                title: media.name.replace(/_/g, '+').capitalize(),
                plot: 'short',
                r: 'json',
            }
            omdbApi.get(params, function(err, data) {
                if (err) {
                  console.log(err)
                  deferred.resolve(media)
                } else {
                  media.poster = data.Poster
                  media.plot = data.Plot
                  media.genre = data.Genre.replace(/\s/g, '').split(",")
                  media.imdbRating = (data.imdbRating === "N/A" ? 0 : data.imdbRating)
                  media.imdbId = data.imdbID
                  media.year = data.Year
                  media.runtime = data.Runtime
                  media.rated = data.Rated
                }
                deferred.resolve(media)
            })
            return deferred.promise
        }

    app.get('/cast/media', function (req, res) {
      Media.find({}).exec(function (err, media) {
        media = _.sortBy(media, 'name')
        if (err){
          return res.status(500).json({ debug: err })
        } else {
          return res.status(200).json(media)
        }
      })
    })

    /***
      Everything under here is for the media update/mapping.
      Don't fuck with it.
    ***/

    app.get('/cast/update', function (req, res) {
      loop_folder('tv2/').then(function(results){
        console.log('finished tv')
    	var promises = []
    	for (var result in results ) {
    	  promises.push(update(results[result]))
    	}
    	promises.push(update('movies2/'))
    	Q.all(promises).then(function(results) {
    	  console.log('finished movies')
    	  _.each(results.splice(results.length-1, 1)[0], function(result){
    		results.push(result)
          })
    	  var promises = []
    	  _.each(results, function(result){
    		result.name = result.name.replace(/_/g,' ').capitalize()
    		promises.push(save(result))
    	  })
    	  Q.all(promises).then(function(result) {
    	    console.log('finished save')
    		return res.status(200).json(results)
    	  }, function(err) {
    		return res.status(500).json({ debug: err })
    	  })
    	}, function(err) {
          return res.status(500).json({ debug: err })
        })
      })
    })

    function save(result){
        if (result.poster === "") {
          console.log('bad value')
          console.log(result)
        }
        return Media.findOneAndUpdate({'name':result.name}, result, {upsert:true}).exec()
    }

    function loop_folder(prefix) {
        var s3 = new AWS.S3()
        var delimiter = '/'
        var deferred = Q.defer();

        s3.listObjects({ Bucket: 'mytv.media.out.video', MaxKeys: 100000, Prefix: prefix, Delimiter: delimiter }, function(err, data) {
          console.log(data)
          var folders = []
          if (err) {
            console.log(err)
            deferred.reject(err)
          }
          for (var prefix in data.CommonPrefixes ) {
            folders.push(data.CommonPrefixes[prefix].Prefix)
          }
          deferred.resolve(folders)
        });
        return deferred.promise
    }

    function update(prefix){
        var s3 = new AWS.S3()
        var Q = require('q')
        var deferred = Q.defer()
        var media = {}

        s3.listObjects({ Bucket: 'mytv.media.out.video', MaxKeys: 100000, Prefix: prefix, Delimiter: '/' }, function(err, data) {
            var folders = []
            if (err) {
              console.log(err)
                deferred.reject(err)
            }
          if (data.Prefix.indexOf("movie") > -1) {
              var promises = []
              _.each(data.CommonPrefixes, function(path){
                  promises.push(checkMedia(path))
              })
              Q.all(promises).then(function(results) {
                deferred.resolve(results)
              }, function (err){
                console.error(err)
              })
          } else {
              var returned = checkMedia(data, data.CommonPrefixes)
              deferred.resolve(returned)
          }
        })

        return deferred.promise
    }

    function checkMedia(mediaObject, episodes){
        var media = {}
        media.path = mediaObject.Prefix
        media.type = mediaObject.Prefix.indexOf('movie') > -1 ? 'movie' : 'tv'
        media.name = mediaObject.Prefix.replace("tv2/","").replace("movies2/","").replace("/","")
        media.episodes = _.map(episodes, function(episode){
          return episode.Prefix
        })
        return requestMeta(media)
    }

    function requestMeta(media) {
        var deferred = Q.defer()
        console.log(media)
        var params = {
            title: media.name.replace(/_/g, '+').capitalize(),
            plot: 'short',
            r: 'json',
        }
        omdbApi.get(params, function(err, data) {
            if (err) {
              console.log(err)
              deferred.resolve(media)
            } else {
              media.poster = data.Poster
              media.plot = data.Plot
              media.genre = data.Genre.replace(/\s/g, '').split(",")
              media.imdbRating = (data.imdbRating === "N/A" ? 0 : data.imdbRating)
              media.imdbId = data.imdbID
              media.year = data.Year
              media.runtime = data.Runtime
              media.rated = data.Rated
            }
            deferred.resolve(media)
        })
        return deferred.promise
    }
}
