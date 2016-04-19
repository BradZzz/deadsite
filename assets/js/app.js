/*! Angular application initialization */

var modules = [
  'ngAnimate',
  'ngMaterial',
  'ui.router',
  'angular-loading-bar',
  'ui.bootstrap',
  'ngFlash',
  'ngFileUpload',
  'ngMdIcons',
  'ngSanitize',
  'com.2fdevs.videogular',
  'com.2fdevs.videogular.plugins.controls',
  'com.2fdevs.videogular.plugins.overlayplay',
  'com.2fdevs.videogular.plugins.poster',
  'angular-carousel'
]

var role = {
    'all' : 0,
    'user' : 1,
    'admin' : 2,
    'super' : 3,
}

var app = angular.module('ambrosia', modules)

app.config(
['$locationProvider', '$stateProvider', '$urlRouterProvider',
function ($locationProvider, $stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/")

  $stateProvider.state('home', {
    url: "/",
    templateUrl: "/assets/html/home/main.html",
    controller: "MainCtrl",
  })

  $locationProvider.html5Mode(true)
}])

app.run(
['$rootScope', '$state', '$stateParams', 'seAuthorization', 'sePrincipal',
function ($rootScope, $state, $stateParams, seAuthorization, sePrincipal) {
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    console.log("state", toState, toParams, fromState, fromParams)

    $rootScope.toState = toState
    $rootScope.toStateParams = toParams

    console.log('toState')
    if (sePrincipal.isIdentityResolved()) {
        console.log('identity resolved')
        seAuthorization.authorize()
    }

  })
}])

app.config(['$mdThemingProvider',
function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('orange')
    .backgroundPalette('grey', {
      'default': '50',
      'hue-1': '100',
      'hue-2': '100',
      'hue-3': '200'
    })
}]);
