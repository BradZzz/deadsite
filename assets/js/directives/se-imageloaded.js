angular.module('ambrosia').directive('imageloaded', ['$rootScope', '$http', '$sce', function ($rootScope, $http, $sce) {
  return {
      restrict: 'A',
      link: function(scope, element, attrs) {
          element.bind('load', function() {
              console.log('image is loaded');
              if (element[0].naturalHeight < 100 || element[0].naturalWidth < 100) {
                $(element).hide()
              }
          });
          element.bind('error', function(){
              console.log('image could not be loaded');
          });
      }
  }
}])
