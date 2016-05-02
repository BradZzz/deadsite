angular.module('ambrosia').directive('seAd', [ function () {
  return {
    restrict: 'E',
    templateUrl: '/assets/html/misc/ad_google.html',
    controller: function(){
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
  }
}])
