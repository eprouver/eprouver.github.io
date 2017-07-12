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
      var beesContainer, hivesContainer, flowersContainer;
      var bkg;

      self.cost = {};
      self.player = -1;
      self.bees = [];
      self.hives = [];
      self.flowers = [];
      self.colors = beesConfig.colors;
      beesServ.territories = startTerritory(beesConfig.width, beesConfig.height);
      self.usePixi = beesConfig.usePixi;

      if (beesConfig.usePixi) {
        if (beesConfig.beeTheme) {
          var textures = {
            flowers: PIXI.Texture.fromImage("images/bees2/flower.png"),
            drone: PIXI.Texture.fromImage("images/bees2/drone.png", true),
            soldier: PIXI.Texture.fromImage("images/bees2/soldier.png", true),
            hives: PIXI.Texture.fromImage("images/bees2/hive.png", true)
          }
        } else {
          var textures = {
            flowers: PIXI.Texture.fromImage("images/space/ast2.png"),
            drone: PIXI.Texture.fromImage("images/space/ship.png", true),
            soldier: PIXI.Texture.fromImage("images/space/soldier.png", true),
            hives: PIXI.Texture.fromImage("images/space/station3.png", true)
          }
        }


      }

      function checklife(b) {

        if (b.life <= 0) {
          if (beesConfig.usePixi) {
            if (b.sprite) {
              b.sprite.parent.removeChild(b.sprite)
            }
          }
          return false;
        }

        return true;
      };


      function updateSprite(v, texture, delta) {
        if (!v) return;

        if (!v.sprite) {
          v.sprite = new PIXI.Sprite(textures[texture]);
          v.sprite.anchor.x = 0.5;
          v.sprite.anchor.y = 0.5;
          v.sprite.scale.x = 0;
          v.sprite.scale.y = 0;

          switch (v.type) {
            case "soldier":
            case "drone":
              beesContainer.addChild(v.sprite);
              v.currentRotation = v.rotate;
              break;
            case "hive":
              if (!beesConfig.beeTheme) {
                v.currentRotation = -10;
              } else {
                v.currentRotation = v.rotate;
              }
              hivesContainer.addChild(v.sprite);
              break;
            case "flower":
              //v.sprite.tint = 0;
              flowersContainer.addChild(v.sprite);
              break;
          }

          /* var filter = new PIXI.filters.PixelateFilter();
          filter.size = new PIXI.Point(10, 10);
          v.sprite.filters = [filter]; */

        }
        if (v.sprite.scale.x < v.targetScale) {
          v.sprite.scale.x += 0.0015 * delta;
          v.sprite.scale.y += 0.0015 * delta;
        } else if (v.sprite.scale.x > v.targetScale) {
          v.sprite.scale.x = v.targetScale;
          v.sprite.scale.y = v.targetScale;
        }

        if (v.transitionTime != null) {
          v.transitionTime = (v.transitionTime || 0) + delta;
          if (v.transitionTime < 1000) {
            //v.sprite.tint = d3.interpolateNumber(v.sprite.tint, parseInt(self.colors(v.team).slice(1), 16))(0.75);
            v.sprite.tint = parseInt(d3.interpolateRgb('#' + v.sprite.tint.toString(16), self.colors(v.team))(v.transitionTime / 950).slice(1), 16);
          } else {
            v.sprite.tint = parseInt(self.colors(v.team).slice(1), 16);
            v.transitionTime = null;
          }
        }

        v.sprite.position.x = v.x + 100;
        v.sprite.position.y = v.y + 100;

        v.sprite.rotation = v.currentRotation;

        // if (v.type == 'drone' || v.type == 'soldier') {
        //   v.sprite.position.x += Math.random() * 2 - 1;
        //   v.sprite.position.y += Math.random() * 2 - 1;
        //   v.sprite.rotation += Math.random() * 0.2 - 0.1;
        // }
      }

      // to render svg into pixi (mini map?)
      // var s = new XMLSerializer();
      // function updateBkg(){
      //   return;
      //   var texture = new PIXI.Texture.fromImage('data:image/svg+xml;charset=utf8,' + '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + s.serializeToString(document.getElementById('territory')));
      //   if(!bkg){
      //     bkg = new PIXI.Sprite(texture);
      //     bkg.position.x = 100;
      //     bkg.position.y = 100;
      //   }else{
      //     _.delay(function(){
      //       bkg.setTexture(texture);
      //     })
      //   }
      //   return bkg;
      // }

      function update(time) {
        var delta = ~~((time || 0) - prevTime);
        prevTime = time;
        beesServ.update(delta).then(function() {

          beesServ.flowers.forEach(function(v) {
            v = updateFields.apply(self, [v, 'flowers']);
            if (beesConfig.usePixi && v) {
              updateSprite(v, 'flowers', delta);
            }
          });
          self.flowers = self.flowers.filter(checklife);

          beesServ.bees.forEach(function(v) {
            v = updateFields.apply(self, [v, 'bees']);
            if (beesConfig.usePixi) {
              updateSprite(v, v ? v.type : '', delta);
            }

          })
          self.bees = self.bees.filter(checklife);

          beesServ.hives.forEach(function(v) {
            v = updateFields.apply(self, [v, 'hives']);
            if (beesConfig.usePixi && v) {
              if (!beesConfig.beeTheme) {
                v.rotate = (v.rotate || 0) + (0.0001 * delta);
              }
              updateSprite(v, 'hives', delta);
            }
          })
          self.hives = self.hives.filter(checklife);

          if (beesConfig.usePixi) {
            renderer.render(stage);
          }

          requestAnimFrame(update);
        }, function() {
          requestAnimFrame(update);
        });
      };



      self.init = function() {
        beesServ.reset();

        if (beesConfig.usePixi) {
          renderer = new PIXI.autoDetectRenderer(beesConfig.width + 200, beesConfig.height + 200, {
            antialias: false,
            transparent: true,
            resolution: 1
          });
          stage = new PIXI.Container();

          flowersContainer = new PIXI.Container();
          hivesContainer = new PIXI.Container();
          beesContainer = new PIXI.Container();

          renderer.backgroundColor = 0;
          stage.addChild(flowersContainer);
          stage.addChild(hivesContainer);
          stage.addChild(beesContainer);
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
          self.scaler = 0.9; //(1 / beesConfig.width) * window.innerWidth * 0.85;

          var iscroll = new IScroll('#scroller', {
            scrollX: true,
            freeScroll: true,
            zoom: true,
            mouseWheel: true,
            wheelAction: 'zoom'
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

        $timeout(function perCheck() {

          beesServ.updateFlowers();
          $timeout(perCheck, 2000);

        }, 2000);
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
        if (!beesServ.territories) return;
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
