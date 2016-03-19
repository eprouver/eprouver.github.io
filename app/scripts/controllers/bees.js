'use strict';

/**
 * @ngdoc function
 * @name frontsApp.controller:BeesCtrl
 * @description
 * # BeesCtrl
 * Controller of the frontsApp
 */

(function(module) {
  var testingtime = 1;

  var config = {
    players: 6,
    scale: 0.15,
    player: -1,
    height: 2000,
    width: 2000,
    flowers: 50,
    precision: 10,
    pollenRate: 0.5 * testingtime,
    speeds: {
      drone: 0.3 * testingtime,
      soldier: 0.3 * testingtime
    },
    cost: {
      drone: 100,
      soldier: 400
    },
    minpollen: 30,
    maxpollen: 60,
    maxtravel: 0.2,
    life: {
      drone: 10,
      hive: 100,
      soldier: 50
    },
    damage: {
      drone: 0.1,
      hive: 0.2,
      soldier: 0.5,
      injury: 0.03
    },
    bee: {
      height: 40,
      width: 40,
      repair: 0.01
    },
    hive: {
      height: 70,
      width: 70,
      repair: 0.06
    },
    flower: {
      height: 40,
      width: 40,
      regrow: 0.1 * testingtime
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

  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

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
        pollen: config.startPollen.flower,
        life: 1
      });
    }

    self.createBee = function(team, home, type, x, y, pollen) {
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
        pollen: pollen || 0
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

      //if a hive is over a flower, kill the flower
      self.flowers = self.flowers.filter(function(f) {
        if (_(self.hives).any(function(h) {
            return compare(f, h)
          })) {
          f.life = -1;
          return false;
        }

        return true;
      });

      self.hives.forEach(function(h1) {
        self.hives.forEach(function(h2) {
          if (h1 == h2) return;
          if (h1.life == 0 || h2.life == 0) return;

          if (compare(h1, h2)) {
            //if a hive collides with another hive return one hive to drone
            if (h1.team == h2.team) {
              self.createBee(h1.team, h1, 'drone', h1.x, h1.y, h2.pollen);
              h2.life = 0;
              self.hives = _(self.hives).without(h2);
              return;
            };

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
                b.goal = undefined;
                if (f.pollen <= 0) return;

                if (b.pollen < config.maxpollen && f.pollen > 0) {

                  //If this flower is not mine / claim it
                  if (f.team !== b.team && b.team !== config.player && self.teams[b.team].drones > 2) {

                    if (self.territories.findTerritory(b.x, b.y) !== b.team) {
                      b.goal = 'takeLand';
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
                  if (!b.home) {
                    b.home = _(self.hives).find({
                      team: b.team
                    });
                  }

                  if (distance(b.x, b.y, b.home.x, b.home.y) > (config.width + config.height) * (0.5 * config.maxtravel)) {
                    b.goal = 'buildHive';
                    var x = b.home.x - b.x;
                    var y = b.home.y - b.y;
                    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                    b.dx = b.x + (x / dist) * config.hive.width * 2;
                    b.dy = b.y + (y / dist) * config.hive.height * 2;
                    return;
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
                if (ob.type == 'soldier') {
                  b.target = ob;
                }

                if (random() > 0.25) {
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
      for (var i = self.flowers.length; i < config.flowers; i++) {
        self.createFlower('flower');
      };

      self.flowers.forEach(function(f) {
        f.team = self.territories.findTerritory(f.x, f.y);
      });
    };

    var beeslength;
    var hivelength;
    var soldiers;
    var lastIntruderCheck = 0;
    var gohomebee = function(b) {
      b.goal = undefined;
      b.dx = b.home.x;
      b.dy = b.home.y;
      return;
    }

    self.update = function(delta) {
      self.bees = self.bees.filter(checklife);
      self.hives = self.hives.filter(checklife);
      self.flowers = self.flowers.filter(checklife);

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

      var checkingIntruders = false;
      lastIntruderCheck = lastIntruderCheck + (delta || 1);
      if(lastIntruderCheck > config.intrudercheck){
        checkingIntruders = true;
        lastIntruderCheck = 0;
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

          if (b.life < config.life.drone) {
            b.life += config.bee.repair;
          }

          if (b.target) {
            if (b.target.life <= 0) {
              b.target = undefined;
              gohomebee(b);
              return;
            }
          }

          if (b.target == undefined) {
            b.target = t.intruders[0];
            if (b.target) {
              b.dx = b.target.x;
              b.dy = b.target.y;
              return;
            } else if (b.team != config.player && self.teams[b.team].soldiers > 3) {
              //Find a weaker team to attack
              var weak = self.teams.filter(function(t) {
                return t.team != b.team;
              }).map(function(t) {
                return t.team;
              });

              if (weak.length) {
                weak = self.hives.filter(function(h) {
                  return weak.indexOf(h.team) > -1;
                }).sort(function(one, two) {
                  return distance(b.x, b.y, one.x, one.y) - distance(b.x, b.y, two.x, two.y);
                })[0];

                if (weak) {
                  b.dx = weak.x;
                  b.dy = weak.y;
                  b.target = weak;
                }

              }

            }

          } else {
            if (b.target.type == 'hive') {
              if (b.team == config.player) {
                return;
              }
              if (t.intruders.length && t.team) {
                b.target = undefined;
              }
            }

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
        return f.pollen > config.minpollen;
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
        if (b.life < config.life.drone) {
          b.life += config.bee.repair;
        }

        if (b.target) {
          if (b.target.pollen <= config.maxpollen) {
            b.target = undefined;
          } else if (b.target.life <= 0) {
            b.target = undefined;
          }
        }

        return b.target == undefined;
      }).filter(function(b) {

        if (ourtargets[b.team].length) {
          b.target = ourtargets[b.team].sort(function(one, two) {
            return distance(b.x, b.y, one.x, one.y) - distance(b.x, b.y, two.x, two.y);
          })[0];
          if (b.target) {
            b.dx = b.target.x;
            b.dy = b.target.y;
          }
          return;
        } else if (readytargets.length) {
          b.target = readytargets.sort(function(one, two) {
            return distance(b.x, b.y, one.x, one.y) - distance(b.x, b.y, two.x, two.y);
          })[0]
          if (b.target) {
            b.dx = b.target.x;
            b.dy = b.target.y;
          }
          return;
        } else {
          if (b.home) {
            gohomebee(b);
            return;
          }
        }

      });

      //how many soldiers
      if (updatebees) {
        soldiers = self.bees.filter(function(b) {
          return b.type == 'soldier'
        }).length;
      }

      //update hives
      _.chain(self.hives).forEach(function(h) {
        if (h.life < config.life.hive) {
          h.life += config.hive.repair;
        }
      }).filter(function(h) {
        return h.team != config.player;
      }).forEach(function(h) {
        var team = self.teams[h.team];

        // Turn hive into drone?
        // if(team.drones == 0){
        //   self.createBee(h.team, undefined, 'drone', h.x, h.y);
        //   team.drones += 1;
        //   h.life = 0;
        //   self.hives = _(self.hives).without(h);
        //   return;
        // }

        if (team.soldiers < (team.drones * 0.7) && team.drones > 2) {
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

      }).value();

      self.flowers.forEach(function(f) {
        if (f.pollen <= config.startPollen.flower) {
          f.pollen += config.flower.regrow;
        }
      });

      _(self.bees)
        .forEach(function(b) {

          //find out which territory I'm in

          if (checkingIntruders) {
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
          if (Math.abs(b.x - b.dx) > config.precision || Math.abs(b.y - b.dy) > config.precision) {
            var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
            b.x = d3.round(b.x + (((b.dx - b.x) / length) * config.speeds[b.type] * (delta || 1)), config.precision);
            b.y = d3.round(b.y + (((b.dy - b.y) / length) * config.speeds[b.type] * (delta || 1)), config.precision);
            //b.unmoved = 0;
          } else {
            if (b.goal == 'takeLand') {
              self.createHive(b.team, b.x, b.y, b.pollen);
              b.life = 0;
              self.bees = _(self.bees).without(b);
              return;
            } else if (b.goal == 'buildHive') {
              if (self.teams[b.team].drones > 3) {
                //if this hive intersects any other hives
                if (_(self.hives.filter(function(h) {
                    return h.team == b.team;
                  })).any(function(h) {
                    return compare(b, h)
                  })) {
                  gohomebee(b);
                  return;
                }

                self.createHive(b.team, b.x, b.y, b.pollen);
                b.life = 0;
                self.bees = _(self.bees).without(b);
                return;
              } else {
                gohomebee(b);
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

  module.controller('BeesCtrl', ['$scope', 'beesServ', '$interval', 'startTerritory', '$timeout',
    function($scope, beesServ, $interval, startTerritory, $timeout) {
      var self = this;
      self.scaler = config.scale;
      beesServ.reset();

      self.cost = config.cost;

      for (var i = 0; i < config.flowers; i++) {
        beesServ.createFlower('flower');
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

      for (var i = 0; i < config.players; i++) {
        beesServ.createTeam('test' + i);
      }
      self.bees = beesServ.bees;
      self.hives = beesServ.hives;
      self.colors = colors;
      self.flowers = beesServ.flowers;
      beesServ.territories = startTerritory(config.width, config.height);
      $timeout(function() {
        new IScroll('#scroller', {
          scrollX: true,
          freeScroll: true,
          zoom: true,
          mouseWheel: true,
          wheelAction: 'zoom'
        });
      }, 100)


      var prevTime = 0;

      function update(time) {
        var delta = (time || 0) - prevTime;
        beesServ.update(delta);
        prevTime = time;

        if (!$scope.$$phase) {
          $scope.$apply(function() {
            self.flowers = beesServ.flowers;
            self.bees = beesServ.bees;
            self.hives = beesServ.hives;
          })
        };

        requestAnimFrame(update);
      };
      update();

      self.boardSize = function(n) {
        if (!n) n = 1;
        return {
          height: config.height * n,
          width: config.width * n
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

    }
  ]);


})(angular.module('frontsApp'));
