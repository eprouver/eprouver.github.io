'use strict';

/**
 * @ngdoc directive
 * @name frontsApp.directive:nodetree
 * @description
 * # nodetree
 */
angular.module('frontsApp')
  .directive('storyNodeRoot', ['$compile', function($compile) {
    return {
      templateUrl: 'views/storynoderoot.html',
      restrict: 'E',
      replace: true,
      controllerAs: 'ntpCtrl',
      controller: ['$scope', '$element', function($scope, $element) {
        var self = this;
        var childholder = $element.find('.childholder');
        var kidElem = [];

        $scope.$watch('kids', function(n) {
          if (typeof n == "string") {
            $scope.kids = JSON.parse($scope.kids);
          };

          kidElem = new Array($scope.kids.length)
        });

        $scope.colClass = function(num) {
          return ~~(12 / num);
        };

        self.showKids = function(parent, index, e) {
          var par = $(e.currentTarget)
          $(e.target).parent().siblings().find('.btn').removeClass('selected')
          par.addClass('selected');
          parent.selected = true;

          if (kidElem[index]) {
            childholder.children().hide();
            kidElem[index].show();
          } else {
            $compile('<story-node-root></story-node-root>')($scope.$new(true), function(el, scope) {
              childholder.children().hide();
              childholder.append(el);
              scope.parent = parent;
              scope.kids = [0, 1, 2, 3, 4].slice(0, ~~(Math.random() * 5)).map(function(v){
                return {
                  data: v,
                  selected: false
                }
              })
              kidElem[index] = el;
              $("html, body").animate({
                scrollTop: $(document).height()
              }, 500);
            })
          }
        };
      }]
    }
  }]);
