'use strict';

/**
 * @ngdoc function
 * @name frontsApp.controller:BeesCtrl
 * @description
 * # BeesCtrl
 * Controller of the frontsApp
 */

(function(module) {
  var testingtime = 0.2;

  var config = {
    player: -1,
    height: 500,
    width: 800,
    precision: 1,
    pollenRate: 0.5 * testingtime,
    speeds: {
      drone: 5 * testingtime,
      soldier: 3 * testingtime
    },
    cost: {
      drone: 400,
      soldier: 100
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
      regrow: 0.01 * testingtime
    },
    intrudercheck: 10,
    startPollen: {
      hive: 100,
      flower: 500
    }
  };

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

  function randomVector() {
    var x = Math.random() - 0.5;
    var y = Math.random() - 0.5;
    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return [x / dist, y / dist]
  };

  module.service('beesServ', function() {
    var self = this;
    self.teams = [];
    self.bees = [];
    self.hives = [];
    self.flowers = [];

    self.reset = function() {
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
      var rando = randomVector();

      var bee = {
        x: x,
        y: y,
        h: config.bee.height,
        w: config.bee.width,
        dx: x + (rando[0] * config.hive.width),
        dy: y + (rando[1] * config.hive.height),
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
      });

      self.hives.forEach(function(h1) {
        self.hives.forEach(function(h2) {

          if (h1 == h2) return;

          if (compare(h1, h2)) {
            if (random() > 0.5) {
              h1.life -= config.damage.hive;
            }
            if (random() > 0.5) {
              h1.life -= config.damage.hive;
            }
          }
        });
      });

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
                  if (b.target) {
                    if (b.target.pollen > 10) {
                      b.dx = b.target.x;
                      b.dy = b.target.y;
                    } else {
                      b.target = undefined;
                    }
                  }
                }
              }
            })

            //if colliding with a flower add pollen
            self.flowers.forEach(function(f) {
              if (compare(b, f)) {
                if (f.pollen <= 0) return;

                if (b.pollen < config.maxpollen && f.pollen > 0) {

                  //If this flower is not mine / claim it
                  if (f.team !== b.team && b.team !== config.player && self.teams[b.team].drones > 2) {

                    if (self.territories.findTerritory(b.x, b.y) !== b.team) {
                      b.goal = 'buildHive';
                      var loc = randomVector();

                      b.dx = f.x + (config.hive.width * 2 * loc[0]);
                      b.dy = f.y + (config.hive.height * 2 * loc[1]);
                    }

                  }


                  b.pollen += config.pollenRate;
                  f.pollen -= config.pollenRate;
                  return;
                } else {
                  if (b.target == undefined) {
                    b.target = f;
                  }
                  b.dx = b.home.x;
                  b.dy = b.home.y;
                  return;
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

    self.updateFlowers = function() {
      self.flowers.forEach(function(f) {
        f.team = self.territories.findTerritory(f.x, f.y);
      });
    };

    var beeslength;
    var hivelength;
    var soldiers;

    self.update = function(time) {
      self.bees = self.bees.filter(checklife);
      self.hives = self.hives.filter(checklife);

      var updatebees = false;
      var updatehives = false;
      if (self.bees.length != beeslength) {
        beeslength = self.bees.length;
        updatebees = true;
      }
      if (self.hives.length != hivelength) {
        hivelength = self.hives.length;
        updatehives = true;
      }

      //update teams
      self.teams.forEach(function(t) {
        t.intruders = t.intruders.filter(checklife);

        if (updatebees) {
          t.soldiers = self.bees.filter(function(b) {
            return b.team == t.team && b.type == 'soldier'
          }).length;
          t.drones = self.bees.filter(function(b) {
            return b.team == t.team && b.type == 'drone'
          }).length;
        }

        if (updatehives) {
          t.hives = self.hives.filter(function(b) {
            return b.team == t.team
          }).length;
        }

        //Find intruders to attack
        self.bees.filter(function(b) {
          return b.team == t.team;
        }).filter(function(b) {
          return b.type == 'soldier';
        }).forEach(function(b) {

          if(t.drones < 2){
            b.type = 'drone';
            b.target = undefined;
            return;
          }

          // if (b.target) {
          //   if (b.target.life) {
          //     if (b.target.life <= 0) {
          //       b.target = b.home;
          //     }
          //   }
          // }

          if (b.target == undefined) {
            b.target = t.intruders[0];
            if (b.target) {
              b.dx = b.target.x;
              b.dy = b.target.y;
            }

          } else {
            if (b.target.type == 'hive') return;

            if (t.intruders.indexOf(b.target) == -1) {
              b.dx = b.x;
              b.dy = b.y;
              b.target = undefined;
              return;
            } else if (b.target.life <= 0) {
              b.dx = b.x;
              b.dy = b.y;
              target = undefined;
              return;
            }

            b.dx = b.target.x;
            b.dy = b.target.y;
          }
        });
      });

      //drones that are not the players and have no target should find one
      var readytargets = self.flowers.filter(function(f) {
        return f.pollen > config.maxpollen;
      });

      var ourtargets = self.teams.map(function(t, i) {
        return readytargets.filter(function(f) {
          return f.team == i;
        });
      });


      //drone things
      self.bees.filter(function(b) {
        return b.type == 'drone';
      }).filter(function(b) {
        if (b.target) {
          if (b.target.pollen <= config.maxpollen) b.target = undefined;
        }

        return b.target == undefined;
      }).filter(function(b) {
        return b.team != config.player;
      }).filter(function(b) {
        if (b.target) {
          if (b.target.life) {
            if (b.target.life <= 0) {
              b.target = undefined;
            }
          }
        }

        if (ourtargets[b.team].length) {
          b.target = ourtargets[b.team][~~(random() * ourtargets[b.team].length)];
          if (b.target) {
            b.dx = b.target.x;
            b.dy = b.target.y;
          }
          return;
        } else if (readytargets.length) {
          b.target = readytargets[~~(random() * readytargets.length)];
          if (b.target) {
            b.dx = b.target.x;
            b.dy = b.target.y;
          }
          return;
        }

      });

      //how many soldiers
      if (updatebees) {
        soldiers = self.bees.filter(function(b) {
          return b.type == 'soldier'
        }).length;
      }

      //update hives
      self.hives.filter(function(h) {
        return h.team != config.player;
      }).forEach(function(h) {
        var team = self.teams[h.team];

        if ((team.soldiers < (soldiers / (self.teams.length + 1)) || team.soldiers == 0) && team.drones > 1) {
          if (h.pollen > config.cost.soldier) {
            self.createBee(h.team, h, 'soldier', h.x, h.y);
            h.pollen -= config.cost.soldier;
            return;
          }
        } else {
          if (h.pollen > config.cost.drone) {
            self.createBee(h.team, h, 'drone', h.x, h.y);
            h.pollen -= config.cost.drone;
            return;
          }
        }

      })

      self.flowers.forEach(function(f) {
        if (f.pollen <= config.startPollen.flower) {
          f.pollen += config.flower.regrow;
        }
      });

      _(self.bees)
        .forEach(function(b) {

          //find out which territory I'm in
          if ((time % config.intrudercheck) == 0) {
            var terr = self.territories.findTerritory(b.x, b.y);
            var team = self.teams[terr];

            if (terr !== b.team) {
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

          //Move the bee
          if (Math.abs(b.x - b.dx) > config.precision && Math.abs(b.y - b.dy) > config.precision) {
            var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
            b.x = d3.round(b.x + (((b.dx - b.x) / length) * config.speeds[b.type]), config.precision);
            b.y = d3.round(b.y + (((b.dy - b.y) / length) * config.speeds[b.type]), config.precision);
            //b.unmoved = 0;
          } else {
            if (b.goal == 'buildHive') {
              if (self.territories.findTerritory(b.x, b.y) != b.team) {
                self.createHive(b.team, b.x, b.y, b.pollen);
                self.bees = _(self.bees).without(b);
                return;
              } else {
                b.goal = undefined;
                b.dx = b.home.x;
                b.dy = b.home.y;
                return;
              }
            }

            //b.unmoved += 1;

            // if(b.unmoved > 3000){
            //   b.target = undefined;
            //   b.dx = b.x + ((Math.random * 300) - 150);
            //   b.dy = b.y + ((Math.random * 300) - 150);
            // }
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
        beesServ.territories.setVerts(scope.bees.hives.map(function(h) {
          return {
            team: h.team,
            loc: [h.x, h.y],
            fill: colors(h.team)
          };
        }));
        beesServ.territories.redraw();
        beesServ.updateFlowers();
      })

      beesServ.createTeam('test1');
      beesServ.createTeam('test2');
      beesServ.createTeam('test3');

      $interval.cancel(beesServ.cancelUpdate);
      beesServ.cancelUpdate = $interval(function(time) {
        beesServ.update(time);
        self.flowers = beesServ.flowers;
        self.bees = beesServ.bees;
        self.hives = beesServ.hives;
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

      beesServ.territories = startTerritory(config.width, config.height);

    }
  ]);


})(angular.module('frontsApp'));
