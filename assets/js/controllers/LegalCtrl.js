angular.module('ambrosia').controller('LegalCtrl',
[ '$scope', 'seStatic', function ($scope, seStatic) {
    $('html, body').animate({ scrollTop: 0 }, 300)
    $scope.legal = seStatic.getSupportParams()
}])