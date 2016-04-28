String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

angular.module('ambrosia').controller('MainCtrl',
['$scope', '$rootScope', '$q', '$sce', '$window', 'seTemplate', 'seStatic',
 function ($scope, $rootScope, $q, $sce, $window, seTemplate, seStatic)
{
    $rootScope.loading = true
    $rootScope.loading = false

    var template = seTemplate.getTemplateMap()
    template = (template === undefined ? 'default' : template)
    var map = seTemplate.getRootMap(template)
    var title = template.replace(/-/g,' ').capitalize() + '.com'
    template = '/assets/html/partials/' + template + '.html'

    console.log(template)

    $scope.ctrl = {
        countdown : moment('08/12/2016').tz("America/Los_Angeles").endOf('day').format(),
        walls : ['alt1', 'alt2', 'alt3', 'alt4', 'alt5'],
        position : 2,
        logoClick : function () {
            this.position += 1
            if (this.position > this.walls.length - 1) {
                this.position = 0
            }
        },
        title : title,
        template : template
    }

    console.log($scope.ctrl.template)
}])