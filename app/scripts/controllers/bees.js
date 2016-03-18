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
    width: 800,
    precision: 1,
    pollenRate: 0.1,
    speeds: {
      drone: 1.1,
      soldier: 0.25
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
      drone: 0.1,
      hive: 0.1,
      soldier: 0.1,
      injury: 0.01
    },
    tasktimes: {
      getp: 1000
    },
    bee: {
      height: 40,
      width: 40
    },
    hive: {
      height: 70,
      width: 70
    },
    flower: {
      height: 40,
      width: 40,
      regrow: 0.005
    },
    intrudercheck: 100,
    startPollen: {
      hive: 100,
      flower: 500
    }
  };

  var territories;

  var colors = d3.scale.category10().domain(d3.range(10));
  var random = Math.random;
  var compare = function(a, b) {
    var ax = a.x - (a.w / 2),
      bx = b.x - (b.w / 2),
      ay = a.y - (a.h / 2),
      by = b.y - (b.h / 2);

    return (ax < bx + b.w &&
      ax + a.w > bx &&
      ay < by + b.h &&
      a.h + ay > by)
  };

  function checklife(b) {
    return b.life > 0
  };

  module.service('beesServ', function() {
    var self = this;
    self.teams = [];
    self.bees = [];
    self.hives = [];
    self.flowers = [];

    self.reset = function(){
      self.teams = [];
      self.bees = [];
      self.hives = [];
      self.flowers = [];
    }

    self.createFlower = function(type) {
      self.flowers.push({
        x: d3.round(random() * config.width, config.precision),
        y: d3.round(random() * config.height, config.precision),
        h: config.flower.height,
        w: config.flower.width,
        type: type,
        pollen: config.startPollen.flower
      });
    }

    self.createBee = function(team, home, type, x, y) {
      var bee = {
        x: x,
        y: y,
        h: config.bee.height,
        w: config.bee.width,
        dx: x + (random() > 0.5? -config.hive.width : config.hive.width),
        dy: y + (random() > 0.5? -config.hive.height : config.hive.height),
        team: team,
        type: type,
        home: home,
        life: config.life[type],
        pollen: 0
      }

      self.bees.push(bee);
      return bee;
    };

    self.createHive = function(team, x, y, pollen) {
      var hive = {
        x: x,
        y: y,
        h: config.hive.height,
        w: config.hive.width,
        team: team,
        life: config.life.hive,
        pollen: pollen || 0,
        type: 'hive'
      };

      self.hives.push(hive);
      return hive;
    };
    self.createTeam = function(name) {
      var teamIndex = self.teams.length;

      var team = {
        name: name,
        color: colors(teamIndex),
        team: teamIndex,
        intruders: []
      };

      var hive = self.createHive(teamIndex, d3.round(random() * config.width, config.precision), d3.round(random() * config.height, config.precision), config.startPollen.hive);
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

        switch (b.type) {
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
                } else if (b.pollen <= 0) {
                  if(b.target){
                    if(b.target.pollen > 10){
                      b.dx = b.target.x;
                      b.dy = b.target.y;
                    }
                  }
                }
              }
            })

            //if colliding with a flower add pollen
            self.flowers.forEach(function(f) {
              if (compare(b, f)) {
                if(f.pollen == 0) return;

                if (b.pollen < config.maxpollen && f.pollen > 0) {
                  b.pollen += config.pollenRate;
                  f.pollen -= config.pollenRate;
                } else{
                  b.target = f;
                  b.dx = b.home.x;
                  b.dy = b.home.y;
                }
              }
            })
            break;

          case 'soldier':
            self.bees.filter(checklife).filter(function(ob) {
              return ob.team !== b.team;
            }).forEach(function(ob) {
              if (compare(b, ob)) {
                if (random() > 0.5) {
                  ob.life -= config.damage[ob.type];
                }

                if (random() > 0.75) {
                  b.life -= config.damage.injury;
                }
              }
            })

            self.hives.filter(checklife).filter(function(ob) {
              return ob.team !== b.team;
            }).forEach(function(ob) {
              if (compare(b, ob)) {
                if (random() > 0.5) {
                  ob.life -= config.damage.hive;
                }

                if (random() > 0.75) {
                  b.life -= config.damage.injury;
                }
              }
            })
            break;
        }
      })
    };

    self.update = function(time) {
      self.teams.forEach(function(t) {
        t.intruders = t.intruders.filter(checklife);

        //Find intruders to attack
          self.bees.filter(function(b) {
            return b.team == t.team;
          }).filter(function(b){
            return b.type == 'soldier';
          }).forEach(function(b) {

            if (b.target == undefined) {
              // b.dx = t.intruders[0].x;
              // b.dy = t.intruders[0].y;
              b.target = t.intruders[0];
            }else{
              if(b.target.type == 'hive') return;

              if(t.intruders.indexOf(b.target) == -1){
                b.dx = b.x;
                b.dy = b.y;
                b.target = undefined;
                return;
              }else if(b.target.life <= 0){
                b.dx = b.x;
                b.dy = b.y;
                target = undefined;
                return;
              }

              b.dx = b.target.x;
              b.dy = b.target.y;
            }
          })

      });

      self.flowers.forEach(function(f){

        if(f.pollen <= config.startPollen.flower){
          f.pollen += config.flower.regrow;
        }
      });

      _(self.bees)
        .forEach(function(b) {
          //Move the bee
          if (Math.abs(b.x - b.dx) > config.precision && Math.abs(b.y - b.dy) > config.precision) {
            var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
            b.x = d3.round(b.x + (((b.dx - b.x) / length) * config.speeds[b.type]), config.precision);
            b.y = d3.round(b.y + (((b.dy - b.y) / length) * config.speeds[b.type]), config.precision);
          }

          //find out which territory I'm in
          if ((time % config.intrudercheck) == 0) {
            var terr = territories.findTerritory(b.x, b.y);

            if (terr !== b.team) {
              var team = _(self.teams).find({
                team: terr
              });

              if (team) {
                if (team.intruders.indexOf(b) == -1) {
                  team.intruders.push(b);
                }
              }

            } else {

              self.teams.forEach(function(t) {
                t.intruders = _(t.intruders).without(b);
              });

            }
          }
        });

      self.checkCollision(true);
    };

  });

  module.controller('BeesCtrl', ['$scope', 'beesServ', '$interval', 'startTerritory',
    function($scope, beesServ, $interval, startTerritory) {
      var self = this;

      beesServ.reset();

      self.cost = config.cost;

      for (var i = 0; i < config.flowers; i++) {
        beesServ.createFlower('test');
      }

      $scope.$watch('bees.hives.length', function(o, n, scope) {
        territories.setVerts(scope.bees.hives.map(function(h) {
          return {
            team: h.team,
            loc: [h.x, h.y],
            fill: colors(h.team)
          };
        }));
        territories.redraw();
      })

      beesServ.createTeam('test1');
      beesServ.createTeam('test2');
      beesServ.createTeam('test3');

      $interval.cancel(beesServ.cancelUpdate);
      beesServ.cancelUpdate = $interval(function(time) {
        self.bees = self.bees.filter(checklife);
        self.hives = self.hives.filter(checklife);
        beesServ.update(time);
        self.flowers = beesServ.flowers;
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
        bee.dx = bee.x;
        bee.dy = bee.y;
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

        self.selectedBee.life = 0;

        self.bees = _(beesServ.bees).without(self.selectedBee);
        beesServ.createHive(self.selectedBee.team, self.selectedBee.x, self.selectedBee.y, self.selectedBee.pollen);

        self.unselect(e);
        self.hives = beesServ.hives;
      };

      self.spawn = function(type, h, e) {
        beesServ.createBee(h.team, h, type, h.x, h.y);
        h.pollen -= config.cost[type];
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

      territories = startTerritory(config.width, config.height);

    }
  ]);


})(angular.module('frontsApp'));
