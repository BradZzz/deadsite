var csv        = require('fast-csv')
var fs         = require('fs')
var Q          = require('q')
var finance    = require('yahoo-finance')
var moment     = require('moment')
var Chance     = require('chance'), chance = new Chance()
var _          = require('underscore')
var request    = require('request')
var cheerio    = require('cheerio')
var mongoose   = require('mongoose')

var financeLib = require('../../lib/financials')
var Financial  = require('../../models/financial')
var utils      = require('../../lib/utils')

var buyFee = 4.95

var cache = {}

module.exports = function (app) {

  var self = this

  app.get('/stock', function (req, res){
    console.log(req.query)
    if ('sym' in req.query) {
        var start = 'start' in req.query ? req.query.start : moment().subtract(6, 'months').format('YYYY-MM-DD')
        var end = 'end' in req.query ? req.query.end : moment().format('YYYY-MM-DD')
        // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
        var period = 'period' in req.query ? req.query.period : 'w'

        console.log(start)
        console.log(end)

        finance.historical({
          symbol: req.query.sym,
          from: start,
          to: end,
          period: period,
        }, function (err, quotes) {
          console.log(err)
          console.log(quotes)
          return res.status(200).json(quotes)
        })
    } else {
        return res.status(400).json("Bad Request")
    }
  })

  function recurseFinancials (title, url) {

    var table = ".yfnc_tabledata1"
    var datas = "tr td table tr"

    var deferred = Q.defer()
    request(url, function(error, response, html){
      // First we'll check to make sure no errors occurred when making the request
      if(!error){
          // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
          var $ = cheerio.load(html);
          var query = table + ' ' + datas
          var formattedTableDat = {}
          var row = []

          $(query).filter(function(){
            var data = $(this)
            _.each(data.children(), function(data1) {
                _.each(data1.children, function(data2) {
                    if ('data' in data2) {
                        var found = data2.data.replace(/^\s+|\s+$/g,'')
                        if (found) {
                            row.push(found)
                            //console.log(found)
                        }
                    }
                    _.each(data2.children, function(data3) {
                        if ('data' in data3) {
                            var found = data3.data.replace(/^\s+|\s+$/g,'')
                            if (found) {
                                row.push(found)
                                //console.log(found)
                            }
                        }
                        _.each(data3.children, function(data4) {
                            if ('data' in data4) {
                                var found = data4.data.replace(/^\s+|\s+$/g,'')
                                if (found) {
                                    row.push(found)
                                    //console.log(found)
                                }
                            }
                        })
                    })
                })
            })
            if (row.length > 1) {
                var index = String(row[0])
                var rowD = JSON.parse(JSON.stringify(row))
                rowD.splice(0,1)
                formattedTableDat[index] = rowD
                row = []
            }
          })
          console.log("<--------- Formatted Results ---------------->")
          console.log(formattedTableDat)
          deferred.resolve({title: title, data: formattedTableDat})
      }
    })
    return deferred.promise
  }

  app.get('/stock/financials', function (req, res){
      console.log(req.query)
      if ('sym' in req.query) {

          var income = "http://finance.yahoo.com/q/bs?s=" + req.query.sym + "&annual"
          var balance = "http://finance.yahoo.com/q/is?s=" + req.query.sym + "&annual"
          var cash = "http://finance.yahoo.com/q/cf?s=" + req.query.sym + "&annual"

          var financials = [
            recurseFinancials('Income Sheet', income),
            recurseFinancials('Balance Sheet', balance),
            recurseFinancials('Cash Flow', cash)
          ]

          Q.all(financials).then(function(gResp){
              console.log("finished")

              var returnPiece = {}

              _.each(gResp, function(lNode){
                //var returnPiece = {}
                _.each(lNode.data, function(value, key){
                    var list = []
                    var currKey = key
                    if (value.length === 1) {
                        returnPiece['**' + currKey] = []
                        currKey = '*' + value[0]
                    } else if (value.length === 4) {
                        returnPiece['**' + currKey] = []
                        currKey = '*' + value.splice(0,1)
                        if (currKey !== "Period Ending") {
                            list = _.map(value,function(num){ return parseInt(num.replace(/\D/g,'')) })
                        } else {
                            list = value
                        }
                    } else {
                        if (currKey !== "Period Ending") {
                            list = _.map(value,function(num){ return parseInt(num.replace(/\D/g,'')) })
                        } else {
                            list = value
                        }
                    }
                    returnPiece[currKey] = list
                })
                //returnScoop.push(returnPiece)
              })
              cache.list = returnPiece
              console.log(returnPiece)
              return res.status(200).json(returnPiece)
          }, function (err){
              console.log("error")
              console.log(err)
          })

      } else {
          return res.status(400).json("Bad Request")
      }
    })

  //This function is dangerous. Don't uncomment unless you know what it does
  /*app.get('/stock/list/update', function(req, res) {
    financeLib.updateList().then(function(data){
      Financial.remove({}, function(err, result) {
        if (err && err.errmsg != 'ns not found') {
          console.log(err)
          return res.status(500).json(err)
        } else {
          Financial.insertMany(data, function(err, docs) {
            if (err) {
              console.log(err)
              return res.status(500).json(err)
            } else {
              return res.status(200).json(docs)
            }
          })
        }
      })
    }, function (err){
      console.log("error")
      console.log(err)
      return res.status(500).json(err)
    })
  })*/

  app.get('/stock/list', function(req, res) {
    //if ('list' in cache) {
    //    return res.status(200).json(cache.list)
    //} else {
        utils.getTheList().then(function(data){
            console.log('returned data')
            if (data === undefined) {
                return res.status(500).json('bad data')
            }
            cache.list = _.map(data, function(tick) {
              var found = {}
              var maxLength = chance.integer({min: 1, max: 10})
              var comments = []
              while (comments.length < maxLength) {
                  comments.push({
                    user: chance.word({syllables: chance.integer({min: 1, max: 10})}),
                    text: chance.paragraph({sentences: chance.integer({min: 1, max: 3})})
                  })
              }
              console.log('adding', tick.symbol)
              return { ticker: tick.symbol, name: tick.name, invested : 0, comments : comments, buyFee : buyFee }
            })
            return res.status(200).json(cache.list)
        })
    //}
  })

//Record.find().distinct('sym', function (err, user_ids) { ... })
  app.get('/stock/testList', function(req, res) {
      if ('testList' in cache) {
          return res.status(200).json(cache.testList)
      } else {
        self.getTheList().then(function(data){
          console.log('back in test list')
          console.log(data)
          if (data === undefined) {
            return res.status(500).json('bad data')
          }
          var tickers = data
          var listSize = tickers.length

          cache.testList = _.map(tickers, function(tick) {
            var maxLength = chance.integer({min: 1, max: 10})
            var comments = []
            while (comments.length < maxLength) {
              comments.push({
                user: chance.word({syllables: chance.integer({min: 1, max: 10})}),
                text: chance.paragraph({sentences: chance.integer({min: 1, max: 3})})
              })
            }
            return { ticker: tick.symbol, name: tick.name, invested : chance.integer({min: 1, max: 250}),
                comments : comments, buyFee : buyFee }
          })
          console.log(cache.testList)
          return res.status(200).json(cache.testList)
        }, function(err){
          return res.status(500).json(err)
        })
      }
  })

  app.get('/stock/snapshot', function(req, res) {
    if ('sym' in req.query) {

      Financial.findOne({
        'symbol': req.query.sym.toUpperCase(),
      }, function(err, dbTick) {
        finance.snapshot({
          symbol: req.query.sym
        }, function (err, snapshot) {
          console.log(err)
          console.log(snapshot)
          if (snapshot === undefined) {
            return res.status(500).json("Snapshot undefined")
          }
          snapshot.meta = dbTick || {}
          return res.status(200).json(snapshot)
        })
      })
    } else {
      return res.status(400).json("Bad Request")
    }
  });

  function getStockStream(stream, exchange){
    var deferred = Q.defer()
    var builder = { name : exchange, data : []}

    var csvStream = csv().on("data", function(data){
       if (data.length > 0 && data[0].trim().toLowerCase() != 'symbol') {
         builder.data.push(data[0].trim())
       }
    }).on("end", function(){
       console.log("done : " + exchange)
       deferred.resolve(builder)
    })

    stream.pipe(csvStream)

    return deferred.promise
  }

}
