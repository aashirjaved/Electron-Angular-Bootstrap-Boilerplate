(function(){
    angular
        .module('main')
        .config(config);
        
    function config($stateProvider,$urlRouterProvider){
        
        $urlRouterProvider.otherwise('/');
        
        $stateProvider
            .state('main', {
                url: '/',
                templateUrl: 'main/main.tpl.html',
                controller: 'MainCtrl',
                controllerAs:'main'
                // controller:function ($scope) {
                //     $scope.crtlName = 'main'
                // }
            });
    }
})()