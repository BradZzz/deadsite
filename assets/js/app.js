/*! Angular application initialization */

var modules = [
  'ngAnimate',
  'ngMaterial',
  'ui.router',
  'angular-loading-bar',
  'ui.bootstrap',
  'ngFlash',
  'ngMdIcons',
  'ngSanitize',
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
['$rootScope', '$state', '$stateParams',
function ($rootScope, $state, $stateParams) {
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
    console.log("state", toState, toParams, fromState, fromParams)

    $rootScope.toState = toState
    $rootScope.toStateParams = toParams

    console.log('toState', $rootScope.toState)
  })
}])