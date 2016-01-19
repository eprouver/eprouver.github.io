'use strict';

/**
 * @ngdoc directive
 * @name chartsApp.directive:sortmatrix
 * @description
 * # sortmatrix
 */
angular.module('chartsApp')
  .directive('sortmatrix', ['$timeout', function ($timeout) {
    return {
      templateUrl: '/views/sortmatrix.html',
      restrict: 'E',
      replace: true,
      controllerAs: 'smCtrl',
      controller: ['$scope', '$element', function($scope, $element){
        var self = this;

        $scope.$on('createMatrix', function(s, data){
          $element.hide();
          self.data = data.data.sort(function(){
            return Math.random() > 0.5;
          });
          self.format = data.format;
          $timeout(function(){
            $('[data-toggle="popover"]').popover({
              trigger: 'hover'
            });
            $element.show('drop', 1000);
          }, 1000);

        });

      }]
    };
  }]);
