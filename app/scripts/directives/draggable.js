'use strict';

/**
 * @ngdoc directive
 * @name chartsApp.directive:draggable
 * @description
 * # draggable
 */
angular.module('chartsApp')
  .directive('draggable', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        element.draggable({
          revert: "invalid",
          zIndex: 100
        });
      }
    };
  });
