'use strict';

/**
 * @ngdoc overview
 * @name frontsApp
 * @description
 * # frontsApp
 *
 * Main module of the application.
 */
angular
  .module('frontsApp', [
    'ngRoute',
    'impressjs'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/bees', {
        templateUrl: 'views/bees.html',
        controller: 'BeesCtrl',
        controllerAs: 'beesholder'
      })
      .when('/story', {
        templateUrl: 'views/story.html',
        controller: 'StoryCtrl',
        controllerAs: 'story'
      })
      .when('/adventure', {
        templateUrl: 'views/adventure.html',
        controller: 'AdventureCtrl',
        controllerAs: 'adventure'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();
