'use strict';

/**
 * @ngdoc function
 * @name frontsApp.controller:BeesCtrl
 * @description
 * # BeesCtrl
 * Controller of the frontsApp
 */

(function(module) {

  module.controller('BeesCtrl', ['$scope', 'beesServ', '$interval', 'startTerritory',
    '$timeout', 'beesConfig', 'compare', 'updateFields',
    function($scope, beesServ, $interval, startTerritory,
      $timeout, beesConfig, compare, updateFields) {
      var self = this;
      self.player = beesConfig.player;
      beesServ.reset();

      self.cost = beesConfig.cost;

      for (var i = 0; i < beesConfig.flowers; i++) {
        beesServ.createFlower('flower');
      }

      $scope.$watch('bees.hives.length', function(o, n, scope) {
        beesServ.territories.setVerts(scope.bees.hives.map(function(h) {
          return {
            team: h.team,
            loc: [h.x, h.y],
            fill: beesConfig.colors(h.team)
          };
        }));
        beesServ.territories.redraw();
        beesServ.updateFlowers();
      })

      for (var i = 0; i < beesConfig.players; i++) {
        beesServ.createTeam('test' + i);
      }
      self.bees = beesServ.bees;
      self.hives = beesServ.hives;
      self.colors = beesConfig.colors;
      self.flowers = beesServ.flowers;
      beesServ.territories = startTerritory(beesConfig.width, beesConfig.height);
      $timeout(function() {
        self.scaler = 1; //(1 / beesConfig.width) * window.innerWidth * 0.85;

        var iscroll = new IScroll('#scroller', {
          scrollX: true,
          freeScroll: true,
          zoom: true,
          mouseWheel: true,
          wheelAction: 'zoom',
          zoomMin: 0.001,
          zoomStart: 5,
          zoomMax: 20
        });

        self.zoomer = self.scaler;

        iscroll.on('zoomEnd', function() {
          self.zoomer = self.scaler * this.scale;
        })

        var hive = _(beesServ.hives).find({
          team: beesConfig.player
        });
        if (hive) {
          iscroll.scrollTo(-(hive.x - beesConfig.hive.width * 10) * self.scaler, -(hive.y - beesConfig.hive.height * 10) * self.scaler, 2000)
        }
      }, 100)

      var prevTime = 0;



      function checklife(b) {
        return b.life >= 0;
      };

      function update(time) {
        var delta = (time || 0) - prevTime;
        prevTime = time;
        beesServ.update(delta / (Math.pow(self.zoomer, 1.2))).then(function() {

          beesServ.flowers.map(function(v) {
            return updateFields.apply(self, [v, 'flowers']);
          })
          self.bees = self.bees.filter(checklife);
          beesServ.bees.map(function(v) {
            updateFields.apply(self, [v, 'bees']);
          })
          self.flowers = self.flowers.filter(checklife);
          beesServ.hives.map(function(v) {
            updateFields.apply(self, [v, 'hives']);
          })
          self.hives = self.hives.filter(checklife);

          requestAnimFrame(update);
        });
      };

      $timeout(update)

      self.boardSize = function(n) {
        if (!n) n = 1;
        return {
          height: beesConfig.height * n,
          width: beesConfig.width * n
        }
      };

      self.selectBee = function(b, e) {
        if (b.team !== beesConfig.player) return;
        self.unselect(e);
        b.target = undefined;
        b.goal = 'user';
        b.dx = b.x;
        b.dy = b.y;
        self.selectedBee = b;
        self.boardState = 'beeSelected';
        e.stopPropagation();
        e.preventDefault();
      };

      self.selectHive = function(h, e) {
        if (h.team !== beesConfig.player) return;
        self.unselect(e);
        self.selectedHive = h;
        self.boardState = 'hiveSelected';
        e.stopPropagation();
        e.preventDefault();
      }

      self.boardClicked = function(e) {
        switch (self.boardState) {
          case 'beeSelected':

            var mybee = _(beesServ.bees).find({
              id: self.selectedBee.id
            })
            mybee.dx = e.offsetX;
            mybee.dy = e.offsetY;
            mybee.target = undefined;
            mybee.goal = 'user';
            break;
        }

        self.unselect(e);
      };

      self.unselect = function(e) {
        self.selectedHive = self.selectedBee = self.boardState = undefined;
        if (!e) return;
        e.stopPropagation();
        e.preventDefault();
      };

      self.buildHive = function(e) {
        if (self.selectedBee.type !== 'drone') {
          self.unselect(e);
          return;
        }

        var canBuild = true;

        self.hives.forEach(function(h) {
          if (compare(self.selectedBee, h)) {
            canBuild = false;
            return;
          }
        });

        if (!canBuild) {
          self.unselect(e);
          return;
        }

        if (beesServ.createHive(self.selectedBee.team, self.selectedBee.x, self.selectedBee.y, self.selectedBee.pollen / 2)) {
          self.selectedBee.life = -1;
        }

        self.unselect(e);
      };

      self.spawn = function(type, h, e) {
        beesServ.createBee(h.team, h, type, h.x, h.y);
        h.pollen -= beesConfig.cost[type];
        self.unselect(e);
      };

      self.attack = function(t, me, e) {
        e.stopPropagation();
        e.preventDefault();
        self.unselect(e);

        me = _(beesServ.bees).find({
          id: me.id
        });
        if (!me) {
          return;
        }

        me.dx = t.x;
        me.dy = t.y;
        me.target = t;
      };

      self.polinate = function(f, me, e) {
        self.boardState = undefined;
        e.stopPropagation();
        e.preventDefault();
        self.unselect(e);

        var me2 = _(beesServ.bees).find({
          id: me.id
        });
        if (!me2) {
          return;
        }

        me.dx = f.x;
        me.dy = f.y;
        me.target = f;
        me.goal = undefined;
      };

    }
  ]);


})(angular.module('frontsApp'));
