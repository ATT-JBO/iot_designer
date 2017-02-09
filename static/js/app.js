'use strict';
/**
 * Created by Jan on 13/11/2016.
 */

var mldesigner = angular.module('mldesigner', ['ngRoute', 'ngMaterial', 'ngMdIcons', 'ui.bootstrap']);

mldesigner.config(['$routeProvider',
     function($routeProvider) {
         //$locationProvider.hashPrefix('!');
         $routeProvider
             .when('/', {
                 controller : 'designerController',
                 templateUrl: '/static/partials/designer.html',
                 access: {restricted: true}
             })
             .when('/login', {
              templateUrl: 'static/partials/login.html',
              controller: 'loginController',
                 access: {restricted: false}
            })
            .when('/logout', {
              controller: 'logoutController',
                access: {restricted: true}
            })
            .otherwise({
                 redirectTo: '/'
             });
    }]);

mldesigner.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
    function (event, next, current) {
      AuthService.getUserStatus()
      .then(function(){
        if ( (!next.access || next.access.restricted) && !AuthService.isLoggedIn()){
          $location.path('/login');
          $route.reload();
        }
      });
  });
});