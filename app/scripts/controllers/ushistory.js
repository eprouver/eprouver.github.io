'use strict';

/**
 * @ngdoc function
 * @name chartsApp.controller:UshistoryCtrl
 * @description
 * # UshistoryCtrl
 * Controller of the chartsApp
 */
angular.module('chartsApp')
  .controller('UshistoryCtrl', ['$scope', '$http', function($scope, $http) {
    var self = this;

    self.startMatrix = function() {
      $http.get('scripts/json/ushistory.json').then(function(res) {
        $scope.$emit('createMatrix', {
          data: res.data.map(function(v) {
            v.location = parseInt(v.location);
            return v;
          }),
          format: [{
            name: "Eighteenth Century",
            type: 'range',
            min: 1700,
            max: 1799
          }, {
            name: "Nineteenth Century",
            type: 'range',
            min: 1800,
            max: 1899
          }, {
            name: "Twentieth Century 1900-1949",
            type: 'range',
            min: 1900,
            max: 1949
          }, {
            name: "Twentieth Century 1950-1999",
            type: 'range',
            min: 1950,
            max: 1999
          }, {
            name: "Twenty-First Century",
            type: 'range',
            min: 2000,
            max: 2099
          }]
        })
      })
    };
  }]);
