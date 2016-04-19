angular.module('ambrosia').directive('sePreview', ['$rootScope', '$http', '$sce', function ($rootScope, $http, $sce) {
  return {
    restrict: 'E',
    templateUrl: '/assets/html/partials/link-preview.html',
    scope: {
      story: '=',
      callback: '&'
    },
    link: function (scope, element, attrs) {
        console.log('stats', scope, this)
    }
  }
}])
