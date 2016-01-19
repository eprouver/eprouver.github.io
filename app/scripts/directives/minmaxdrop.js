'use strict';

/**
 * @ngdoc directive
 * @name chartsApp.directive:minmaxdrop
 * @description
 * # minmaxdrop
 */
angular.module('chartsApp')
  .directive('minmaxdrop', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        scope.dropper.dropped = [];
        element.droppable({
          accept: function(){
            return arguments[0].scope().datum.location >= scope.dropper.min && arguments[0].scope().datum.location <= scope.dropper.max;
          },
          drop: function(){
            arguments[1].draggable.hide('highlight', 1000, function(){
              scope.dropper.dropped.push($(this).scope().datum);
              scope.$apply();
              $(this).remove();
            });
            $('.popover').removeClass('in');
          }
        })
      }
    };
  });
