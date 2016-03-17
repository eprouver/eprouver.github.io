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
    'ngRoute'
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
        controllerAs: 'bees'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
