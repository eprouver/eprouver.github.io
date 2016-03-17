'use strict';

/**
 * @ngdoc function
 * @name frontsApp.controller:BeesCtrl
 * @description
 * # BeesCtrl
 * Controller of the frontsApp
 */

(function(module) {
  var config = {
    height: 500,
    width: 500,
    precision: 1,
    pollenRate: 0.1,
    speeds: {
      drone: 1,
      soldier: 0.5
    },
    cost: {
      drone: 100,
      soldier: 400
    },
    maxpollen: 30,
    flowers: 10,
    life: {
      drone: 10,
      hive: 100,
      soldier: 50
    },
    damage: {
      drone: 0.02,
      hive: 0.1,
      soldier: 0.1
    },
    tasktimes: {
      getp: 1000
    },
    bee: {
      height: 40,
      width: 40
    },
    hive: {
      height: 50,
      width: 50
    },
    flower: {
      height: 40,
      width: 40
    }
  };

  var colors = d3.scale.category10().domain(d3.range(10));
  var random = Math.random;
  var compare = function(a, b) {
    return (a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.h + a.y > b.y)
  };
  function checklife(b){
    return b.life > 0
  }

  module.service('beesServ', function() {
    var self = this;
    self.teams = [];
    self.bees = [];
    self.hives = [];
    self.flowers = [];

    self.createFlower = function(type) {
      self.flowers.push({
        x: d3.round(random() * config.width, config.precision),
        y: d3.round(random() * config.height, config.precision),
        h: config.flower.height,
        w: config.flower.width,
        type: type
      });
    }

    self.createBee = function(team, home, type, x, y) {
      var bee = {
        x: x,
        y: y,
        h: config.bee.height,
        w: config.bee.width,
        dx: x,
        dy: y,
        team: team,
        type: type,
        home: home,
        life: config.life[type],
        pollen: 0
      }

      self.bees.push(bee);
    };

    self.createHive = function(team, x, y, pollen) {
      var hive = {
        x: x,
        y: y,
        h: config.hive.height,
        w: config.hive.width,
        team: team,
        life: config.life.hive,
        pollen: pollen || 0
      };

      self.hives.push(hive);
      return hive;
    };
    self.createTeam = function(name) {
      var teamIndex = self.teams.length;

      var team = {
        name: name,
        color: colors(teamIndex),
        team: teamIndex
      };

      var hive = self.createHive(teamIndex, d3.round(random() * config.width, config.precision), d3.round(random() * config.height, config.precision), 100);
      self.createBee(teamIndex, hive, 'drone', hive.x, hive.y);
      self.teams.push(team);
    };

    self.checkCollision = function() {
      self.flowers = self.flowers.filter(function(f) {
        return !_(self.hives).any(function(h) {
          return compare(f, h)
        });
      })

      //drone collisions
      self.bees.filter(checklife).forEach(function(b) {

        switch(b.type){
          case 'drone':
          //see if colliding with my hives
          self.hives.filter(checklife).filter(function(h) {
            return b.team == h.team;
          }).forEach(function(h) {
            //if drone hits home update home
            if (compare(b, h)) {
              if (h != b.home) {
                b.home = h;
              };

              if (b.pollen > 0) {
                h.pollen += config.pollenRate;
                b.pollen -= config.pollenRate;
              } else if (b.pollen <= 0 && b.target) {
                b.dx = b.target.x;
                b.dy = b.target.y;
              }
            }
          })

          //if colliding with a flower add pollen
          self.flowers.forEach(function(f) {
            if (compare(b, f)) {
              if (b.pollen < config.maxpollen) {
                b.pollen += config.pollenRate;
              } else {
                b.dx = b.home.x;
                b.dy = b.home.y;
              }
            }
          })
          break;

          case 'soldier':
          self.bees.filter(checklife).filter(function(ob){
            return ob.team !== b.team;
          }).forEach(function(ob) {
            if(compare(b, ob)){
              ob.life -= config.damage[ob.type];
            }
          })

          self.hives.filter(checklife).filter(function(ob){
            return ob.team !== b.team;
          }).forEach(function(ob) {
            if(compare(b, ob)){
              ob.life -= config.damage.hive;
            }
          })
          break;
        }


      })




    };

    self.update = function() {
      _(self.bees)
        .forEach(function(b) {
          if (b.x !== b.dx && b.y !== b.dy) {
            var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
            b.x = d3.round(b.x + (((b.dx - b.x) / length) * config.speeds[b.type]), config.precision);
            b.y = d3.round(b.y + (((b.dy - b.y) / length) * config.speeds[b.type]), config.precision);

            var dx = Math.abs(b.x - b.dx) <= config.precision;
            var dy = Math.abs(b.y - b.dy) <= config.precision;

            if (dx) {
              b.x = b.dx;
            }
            if (dy) {
              b.y = b.dy;
            }
          }
        });

      self.checkCollision(true);
    };

  });



  module.controller('BeesCtrl', ['beesServ', '$interval', function(beesServ, $interval) {
    var self = this;

    self.cost = config.cost;

    for (var i = 0; i < config.flowers; i++) {
      beesServ.createFlower('test');
    }

    beesServ.createTeam('test1');
    beesServ.createTeam('test2');

    var cancelUpdate = $interval(function(){
      self.bees = self.bees.filter(checklife);
      self.hives = self.hives.filter(checklife);
      beesServ.update();
    });

    self.bees = beesServ.bees;
    self.hives = beesServ.hives;
    self.colors = colors;
    self.flowers = beesServ.flowers;

    self.boardSize = function() {
      return {
        height: config.height,
        width: config.width
      }
    };

    self.selectBee = function(bee, e) {
      self.unselect(e);
      self.selectedBee = bee;
      self.boardState = 'beeSelected';
      e.stopPropagation();
      e.preventDefault();
    };

    self.selectHive = function(h, e) {
      self.unselect(e);
      self.selectedHive = h;
      self.boardState = 'hiveSelected';
      e.stopPropagation();
      e.preventDefault();
    }

    self.boardClicked = function(e) {
      switch (self.boardState) {
        case 'beeSelected':
          self.selectedBee.dx = e.offsetX;
          self.selectedBee.dy = e.offsetY;
          self.selectedBee.target = undefined;
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
      if(self.selectedBee.type !== 'drone'){
        self.unselect(e);
        return;
      }

      var canBuild = true;

      self.hives.forEach(function(h){
        if(compare(self.selectedBee, h)){
          canBuild = false;
          return;
        }
      });

      if(!canBuild){
        self.unselect(e);
        return;
      }

      self.selectedBee.life = 0;

      self.bees = _(beesServ.bees).without(self.selectedBee);
      beesServ.createHive(self.selectedBee.team, self.selectedBee.x, self.selectedBee.y, self.selectedBee.pollen);

      self.unselect(e);
      self.hives = beesServ.hives;
    };

    self.spawn = function(type, h, e){
      beesServ.createBee(h.team, h, type, h.x, h.y);
      self.unselect(e);
      self.bees = beesServ.bees;
    };

    self.attack = function(t, me, e) {
      me.dx = t.x;
      me.dy = t.y;
      me.target = t;

      e.stopPropagation();
      e.preventDefault();
      self.unselect(e);
    };

    self.polinate = function(f, me, e) {
      self.boardState = undefined;
      me.dx = f.x;
      me.dy = f.y;
      me.target = f;

      e.stopPropagation();
      e.preventDefault();
      self.unselect(e);
    };

  }]);

})(angular.module('frontsApp'));
