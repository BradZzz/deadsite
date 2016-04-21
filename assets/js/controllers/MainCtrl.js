angular.module('ambrosia').controller('MainCtrl',
['$scope', '$rootScope', '$q',
 function ($scope, $rootScope, $q)
{
    $rootScope.loading = true
    $rootScope.loading = false

    $scope.ctrl = {
        countdown : moment('08/12/2016').tz("America/Los_Angeles").endOf('day').format(),
        walls : ['alt1', 'alt2', 'alt3', 'alt4', 'alt5'],
        position : 2,
        logoClick : function () {
            this.position += 1
            if (this.position > this.walls.length - 1) {
                this.position = 0
            }
        }
    }

}])