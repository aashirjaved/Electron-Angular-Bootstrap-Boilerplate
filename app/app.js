// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
// console.log('The author of this app is:', appDir.read('package.json', 'json').author);

// document.addEventListener('DOMContentLoaded', function () {
    
// });

// window.$ = window.jQuery = require("jquery");

(function () {
  'use strict';

  /* @ngdoc object
   * @name timecard
   * @requires $urlRouterProvider
   *
   * @description
   * Simple angular app 
   *
   */
  angular
    .module('timecard', [
      'ui.router'
    ]);

  angular
    .module('timecard')
    .config(config);

  function config($stateProvider,$urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('home', {
        url: '/',
        template: '<h3 class="text-center">hello {{ctrlName }}</h3>',
        controller: function($scope){
            $scope.ctrlName = 'HomeCtrl';
             
            console.log('home route loaded');
        }
      });
  }
  
  console.log('angular.ready',angular);

})();
