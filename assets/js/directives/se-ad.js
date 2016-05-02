angular.module('ambrosia').directive('seAd', ['$templateCache', function ($templateCache) {
  return {
    restrict: 'E',
    templateUrl: function(){
        //This is kind of a cheat to figure out if ads are blocked
        //A variable is assigned in showads.js. If it's undefined,
        //we know we have something blocking our ads

        if( window.canRunAds === undefined ){
          console.log('blocked')
          return '/assets/html/misc/alt_no_ad.html'
        } else {
          console.log('not blocked')
          return '/assets/html/misc/ad_google.html'
        }
    },
    controller: function(){
        (adsbygoogle = window.adsbygoogle || []).push({})
    }
  }
}])
