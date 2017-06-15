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
      var prevTime = 0;
      var renderer;
      var stage;

      self.cost = {};
      self.player = -1;
      self.bees = [];
      self.hives = [];
      self.flowers = [];
      self.colors = beesConfig.colors;
      beesServ.territories = startTerritory(beesConfig.width, beesConfig.height);
      self.usePixi = beesConfig.usePixi;

      if (beesConfig.usePixi) {
        var textures = {
          flowers: PIXI.Texture.fromImage("images/space/ast2.png"),
          drone: PIXI.Texture.fromImage("images/space/ship.png", true),
          soldier: PIXI.Texture.fromImage("images/space/soldier.png", true),
          hives: PIXI.Texture.fromImage("images/space/station3.png", true)
        }
      }

      function checklife(b) {

        if(b.life <= 0){
          if(beesConfig.usePixi){
            if(b.sprite){
              stage.removeChild(b.sprite)
            }
          }
          return false;
        }

        return true;
      };

      function updateSprite(v, texture) {
        if (!v) return;

        if (!v.sprite) {
          v.sprite = new PIXI.Sprite(textures[texture]);
          v.sprite.anchor.x = 0.5;
          v.sprite.anchor.y = 0.5;
          /* var filter = new PIXI.filters.PixelateFilter();
          filter.size = new PIXI.Point(10, 10);
          v.sprite.filters = [filter]; */
          stage.addChild(v.sprite);
        }

        v.sprite.tint = d3.interpolateNumber(v.sprite.tint, parseInt(self.colors(v.team).slice(1), 16))(0.75);
        v.sprite.position.x = v.x + 100;
        v.sprite.position.y = v.y + 100;
        v.currentRotation = d3.interpolateNumber(v.currentRotation || 0, v.rotate || 0)(0.25);
        v.sprite.rotation = v.currentRotation;
      }

      function update(time) {
        var delta = (time || 0) - prevTime;
        prevTime = time;
        beesServ.update(delta).then(function() {

          beesServ.flowers.forEach(function(v) {
            v = updateFields.apply(self, [v, 'flowers']);
            if (beesConfig.usePixi && v) {
              updateSprite(v, 'flowers');
            }
          });
          self.flowers = self.flowers.filter(checklife);

          beesServ.bees.forEach(function(v) {
            v = updateFields.apply(self, [v, 'bees']);
            if (beesConfig.usePixi) {
              updateSprite(v, v? v.type: '');
            }

          })
          self.bees = self.bees.filter(checklife);

          beesServ.hives.forEach(function(v) {
            v = updateFields.apply(self, [v, 'hives']);
            if (beesConfig.usePixi && v) {
              v.rotate = (v.rotate || 0) + (0.0001 * delta);
              updateSprite(v, 'hives');
            }
          })
          self.hives = self.hives.filter(checklife);

          if (beesConfig.usePixi) {
            renderer.render(stage);
          }

          requestAnimFrame(update);
        }, function(){
          requestAnimFrame(update);
        });
      };



      self.init = function() {
        beesServ.reset();

        if (beesConfig.usePixi) {
          renderer = new PIXI.WebGLRenderer(beesConfig.width + 200, beesConfig.height + 200);
          stage = new PIXI.Container();
          renderer.backgroundColor = 0x000000;
          $('#bees .board-holder').append(renderer.view);
        }

        for (var i = 0; i < beesConfig.flowers; i++) {
          beesServ.createFlower('flower');
        }

        for (var i = 0; i < beesConfig.players; i++) {
          beesServ.createTeam('test' + i);
        }

        self.cost = beesConfig.cost;
        self.player = beesConfig.player;
        self.bees = beesServ.bees;
        self.hives = beesServ.hives;
        self.colors = beesConfig.colors;
        self.flowers = beesServ.flowers;

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

        $timeout(update)

        $timeout(function perCheck(){

          beesServ.updateFlowers();
          $timeout(perCheck, 2000);

        },2000);
      }

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
        self.selectedBeeId = b.id;
        self.selectedBeeType = b.type;
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
              id: self.selectedBeeId
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
        self.selectedHive = self.selectedBeeId = self.boardState = undefined;
        if (!e) return;
        e.stopPropagation();
        e.preventDefault();
      };

      self.buildHive = function(e) {
        var mybee = _(beesServ.bees).find({
          id: self.selectedBeeId
        });
        if (mybee.type !== 'drone') {
          self.unselect(e);
          return;
        }

        var canBuild = true;

        self.hives.forEach(function(h) {
          if (compare(mybee, h)) {
            canBuild = false;
            return;
          }
        });

        if (!canBuild) {
          self.unselect(e);
          return;
        }

        if (beesServ.createHive(mybee.team, mybee.x, mybee.y, mybee.pollen / 2)) {
          mybee.life = -1;
        }

        self.unselect(e);
      };

      self.spawn = function(type, h, e) {
        beesServ.createBee(h.team, h, type, h.x, h.y);
        h.costs += beesConfig.cost[type];
        self.unselect(e);
      };

      self.attack = function(t, me, e) {
        e.stopPropagation();
        e.preventDefault();
        self.unselect(e);

        me = _(beesServ.hives).find({
          id: me.id
        });
        if (!me) {
          return;
        }

        me.dx = t.x;
        me.dy = t.y;
        me.target = t;
      };

      self.polinate = function(f, id, e) {
        self.boardState = undefined;
        e.stopPropagation();
        e.preventDefault();
        self.unselect(e);

        var me = _(beesServ.bees).find({
          id: id
        });
        if (!me) {
          return;
        }

        me.dx = f.x;
        me.dy = f.y;
        me.target = f;
        me.goal = undefined;
      };

      $scope.$watch('bees.hives.length', function(o, n, scope) {
        if(!beesServ.territories) return;
        beesServ.territories.setVerts(scope.bees.hives.map(function(h) {
          return {
            team: h.team,
            loc: [h.x, h.y],
            fill: beesConfig.colors(h.team)
          };
        }));
        beesServ.territories.redraw();
        setTimeout(beesServ.updateFlowers, 500);
      });

      self.init();

        // beesServ.createBee(1, null, 'soldier', 400, 400);
        // beesServ.createBee(2, null, 'soldier', 600, 600);
        // requestAnimFrame(update)


    }
  ]);


})(angular.module('frontsApp'));
