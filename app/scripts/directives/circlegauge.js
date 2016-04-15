(function(module) {

  module.directive('circleGauge', [function() {
    //circle gauge to display numerical value
    return {
      restrict: 'A',
      //replace: true,
      scope: {
        value: '=',
        min: '@',
        max: '@',
        back: '@',
        display: '@',
        radius: '@',
        thickness: '@'
      },
      template: '<div class="circle-gauge"></div>',
      controller: ['$scope', '$element', function($scope, $element) {

        $scope.min = parseInt($scope.min);
        $scope.max = parseInt($scope.max);
        $scope.radius = parseInt($scope.radius);
        $scope.thickness = parseInt($scope.thickness);
        if ($scope.value == undefined) {
          $scope.value = 0;
        }

        var radius = Math.min($scope.width, $scope.height) / 2;

        var holder = d3.select($element[0]).append("svg")
          .attr("width", $scope.radius * 2)
          .attr("height", $scope.radius * 2)
          .append("g")
          .attr("transform", "translate(" + $scope.radius + "," + $scope.radius + ")");

        var pie = d3.layout.pie()
          .value(function(d) {
            return d.start;
          })
          .sort(null);

        var arc = d3.svg.arc()
          .innerRadius($scope.radius - $scope.thickness)
          .outerRadius($scope.radius);

        var data = [{
          start: $scope.max - $scope.value,
          end: $scope.value,
          color: $scope.display
        }, {
          start: $scope.value,
          end: $scope.max - $scope.value,
          color: $scope.back
        }]

        var path = holder.datum(data).selectAll("path.timer")
          .data(pie)
          .enter()
          .append("path")
          .attr("fill", function(d, i) {
            return d.data.color;
          })
          .attr("d", function(d) {
            return arc(d);
          })

        function arcTween(a) {
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return arc(i(t));
          };
        }

        function start(n, o) {
          var data = [{
            start: o,
            end: n,
            color: $scope.display
          }, {
            start: $scope.max - o,
            end: $scope.max - n,
            color: $scope.back
          }]

          path.each(function(d) {
            this._current = d;
          });
          holder.datum(data).selectAll("path.timer")
            .data(pie)
            .enter();

          pie.value(function(d) {
            return d.end;
          });
          path = path.data(pie); // compute the new angles
          path.transition()
            .ease('linear')
            .duration(1000)
            .attrTween("d", arcTween).each("end", function() {
              pie.value(function(d) {
                return d.end;
              });
              path = path.data(pie).attr("d", arc);
            });

        }

        $scope.$watch('value', function(n, o) {
          if (n > $scope.max) n = $scope.max;
          if (n < $scope.min) n = $scope.min;

          start(n, o);
        })

      }]
    }
  }])

})(angular.module('frontsApp'));
