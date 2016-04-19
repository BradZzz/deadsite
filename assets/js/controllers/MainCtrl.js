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
                return site.url.indexOf('reddit') == -1 && site.url.indexOf('imgur') == -1}
            ), function(story) {
            story.imgs = _.map(
                _.filter(story.imgs, function(img) {
                    return img.height > 100 && img.width > 100
                }),
                function(dat){
                    if (dat.height > dat.width) {
                        dat.nheight = '100%'
                        dat.nwidth = 'auto'
                        return dat
                    } else if (dat.height < dat.width) {
                        dat.nheight = 'auto'
                        dat.nwidth = '100%'
                        return dat
                    } else {
                        dat.nheight = '250px'
                        dat.nwidth = '250px'
                        return dat
                    }
                }
            )
            if (story.imgs < 1) {
                story.imgs.push({ src : '/assets/img/test/google_logo.png', nheight : '120px', nwidth : '300px' })
            }
            return story
        }), function (dat) { return dat.imgs.length > 0 })
        while ($scope.ctrl.stories.length % 3 !== 0) {
            $scope.ctrl.stories.push({})
        }
        console.log($scope.ctrl.stories)
        $rootScope.loading = false
    })

}])