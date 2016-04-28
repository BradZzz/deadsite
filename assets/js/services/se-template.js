angular.module('ambrosia').service('seTemplate',
['$http', '$window',
function ($http, $window)
{
  var self = this
  self.logName = 'seTemplate'

  self.templateMap = {
    'declaration-of-independence' : 'declaration-of-independence',
    'localhost' : 'declaration-of-independence',
  }

  self.getRootMap = function (template) {
    return {
       hex : template === 'declaration-of-independence',
    }
  }

  self.getTemplateMap = function() {
    return _.find(self.templateMap, function(value, key){
        return $window.location.href.indexOf(key) > -1
    })
  }

}]);
