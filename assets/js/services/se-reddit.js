angular.module('ambrosia').service('seReddit',
['$http', '$q', '$rootScope', 'Flash',
function ($http, $q, $rootScope, Flash)
{
  var self = this
  self.logName = 'seReddit'
  self.cache = {}

  self.getRecent = function () {
      if ('getRecent' in self.cache) {
        var deferred = $q.defer()
        deferred.resolve(self.cache.getRecent)
        return deferred.promise
      } else {
          return $http({
            url: '/agg/get',
            params: {
               params : 'google+googlefiber',
            },
            method: 'GET'
          }).then(function (response) {
            console.log(response)
            self.cache.getRecent = response.data
            return response.data
          })
      }
    }
}])