angular.module('ambrosia').controller('MainCtrl',
['$scope', '$rootScope', '$q', 'seReddit',
 function ($scope, $rootScope, $q, seReddit)
{
    console.log('MainCtrl')
    $rootScope.loading = true

    $scope.ctrl = {
        exclude : 'reddit',
        stories : [],
    }

    seReddit.getRecent().then(function(result){
        console.log(result)
        $scope.ctrl.stories = _.filter(_.map(
            _.filter(result, function(site) {
                return site.url.indexOf('reddit') == -1 && site.url.indexOf('i.imgur') == -1}
            ), function(story) {
            story.imgs = _.map(
                _.filter(story.imgs, function(img) {
                    return img.height > 100 && img.width > 100
                }),
                function(dat){
                    if (dat.height > dat.width) {
                        dat.nheight = '300px'
                        dat.nwidth = '200px'
                        return dat
                    } else if (dat.height < dat.width) {
                        dat.nheight = '200px'
                        dat.nwidth = '300px'
                        return dat
                    } else {
                        dat.nheight = '250px'
                        dat.nwidth = '250px'
                        return dat
                    }
                }
            )
            return story
        }), function (dat) { return dat.imgs.length > 0 })
        console.log($scope.ctrl.stories)
        $rootScope.loading = false
    })

}])