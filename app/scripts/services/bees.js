(function(module) {
  var testingtime = 0.5;

  var worker = new Worker('scripts/workers/bees.js');
  //AABB testing
  module.factory('compare', function() {
    return function compare(a, b) {
      var ax = a.x - (a.w / 2),
        bx = b.x - (b.w / 2),
        ay = a.y - (a.h / 2),
        by = b.y - (b.h / 2);

      return (ax < bx + b.w &&
        ax + a.w > bx &&
        ay < by + b.h &&
        a.h + ay > by)
    }
  });

  module.factory('updateFields', function() {
    return function updateFields(a, type) {
      var dest = _(this[type]).find({
        id: a.id
      });

      if (dest == undefined) {
        this[type].push(a);
      }
      return _.extend(dest, a);
    }
  })

  module.service('beesConfig', function() {
    return {
      player: -1,
      players: 2,
      height: 1000,
      width: 1000,
      flowers: 15,
      scarcity: 1000,
      precision: 1,
      colors: d3.scale.category10().domain(d3.range(10)),
      pollenRate: 0.08 * testingtime,
      speeds: {
        drone: 0.3 * testingtime,
        soldier: 0.4 * testingtime
      },
      cost: {
        drone: 100,
        soldier: 800
      },
      minpollen: 30,
      maxpollen: 150,
      maxtravel: 0.2,
      dronePercentage: 0.2,
      life: {
        drone: 10,
        hive: 100,
        soldier: 50
      },
      damage: {
        drone: 0.05 * testingtime,
        hive: 0.275 * testingtime,
        soldier: 0.25 * testingtime,
        injury: 0.1 * testingtime
      },
      bee: {
        height: 40,
        width: 40,
        repair: 0.001 * testingtime
      },
      hive: {
        height: 70,
        width: 70,
        repair: 0.003,
        cost: 0.0005 * testingtime
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
  });

  var random = Math.random;

  function checklife(b) {
    return b.life > 0
  };

  //Random unit vector
  function randomVector() {
    var x = Math.random() - 0.5;
    var y = Math.random() - 0.5;
    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return [x / dist, y / dist]
  };

  //distance between two points
  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }






  /*Bees Service*/

  module.service('beesServ', ['beesConfig', '$q', 'compare', 'updateFields',
    function(beesConfig, $q, compare, updateFields) {
      var self = this;
      self.teams = [];
      self.bees = [];
      self.hives = [];
      self.flowers = [];

      var config = _.clone(beesConfig);
      delete config.colors;

      self.reset = function() {
        self.teams = [];
        self.bees = [];
        self.hives = [];
        self.flowers = [];
      }

      self.createFlower = function(type) {
        self.flowers.push({
          id: _.uniqueId(),
          x: random() * beesConfig.width,
          y: random() * beesConfig.height,
          h: beesConfig.flower.height,
          w: beesConfig.flower.width,
          type: type,
          pollen: beesConfig.startPollen.flower,
          life: 1
        });
      }

      self.createBee = function(team, home, type, x, y, pollen) {
        var rando = randomVector();
        var bee = {
          id: _.uniqueId(),
          x: x,
          y: y,
          h: beesConfig.bee.height,
          w: beesConfig.bee.width,
          dx: x + (rando[0] * beesConfig.hive.width),
          dy: y + (rando[1] * beesConfig.hive.height),
          team: team,
          type: type,
          home: home,
          life: beesConfig.life[type],
          maxLife: beesConfig.life[type],
          pollen: pollen || 0,
          maxPollen: beesConfig.maxpollen
        }

        self.bees.push(bee);
        return bee;
      };

      self.createHive = function(team, x, y, pollen) {

        //If this hive collides with another on the same team, don't build it
        if (_.chain(self.hives).filter(function(h) {
            return h.team == team;
          }).any(function(h) {
            return compare(h, {
              x: x,
              y: y,
              h: beesConfig.hive.height,
              w: beesConfig.hive.width
            })
          }).value()) {
          return false;
        }

        var hive = {
          id: _.uniqueId(),
          x: x,
          y: y,
          h: beesConfig.hive.height,
          w: beesConfig.hive.width,
          team: team,
          life: beesConfig.life.hive,
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
          color: beesConfig.colors(teamIndex),
          team: teamIndex,
          intruders: []
        };

        var hive = self.createHive(teamIndex, random() * beesConfig.width, random() * beesConfig.height, beesConfig.startPollen.hive);
        self.createBee(teamIndex, hive, 'drone', hive.x, hive.y);
        self.teams.push(team);
      };

      self.updateFlowers = function() {
        //Add flowers if some have been removed
        for (var i = self.flowers.length; i < beesConfig.flowers; i++) {
          self.createFlower('flower');
        };

        //Update the location of each flower (which territory is it in?)
        self.flowers.forEach(function(f) {
          f.team = self.territories.findTerritory(f.x, f.y);
        });
      };

      var lastTimestamp = 0;
      var lastIntruderCheck = 0;

      var gohomebee = function(b) {
        b.goal = undefined;
        b.dx = b.home.x;
        b.dy = b.home.y;
        return;
      }

      var defer;

      worker.addEventListener('message', function(e) {
        if (e.timestamp < lastTimestamp) {
          if (defer) {
            defer.reject();
          }
          return;
        }

        lastTimestamp = e.timestamp;

        // e.data.flowers.map(function(v){
        //   return updateFields.apply(self, [v, 'flowers']);
        // })

        // e.data.hives.map(function(v){
        //   updateFields.apply(self, [v, 'hives']);
        // })

        e.data.bees.filter(function(b) {
          return b.goal !== 'user';
        }).map(function(v) {
          updateFields.apply(self, [v, 'bees']);
        })

        self.flowers = e.data.flowers;
        self.hives = e.data.hives;

        //self.bees = e.data.bees;

        self.teams = e.data.teams;

        var delta = e.data.delta;

        if (e.data.createFlower) {
          self.createFlower('flower');
        }


        self.hives.filter(function(h) {
          return h.team != beesConfig.player;
        }).forEach(function(h) {
          var team = self.teams[h.team];

          //If there aren't enough soldiers, make one first
          //else make a drone if you can offordone
          if (team.soldiers < (team.drones * beesConfig.dronePercentage) && team.drones > team.hives) {
            if (h.pollen > beesConfig.cost.soldier) {
              self.createBee(h.team, h, 'soldier', h.x, h.y);
              h.pollen -= beesConfig.cost.soldier;
              return;
            }
          } else {
            if (h.pollen > beesConfig.cost.drone) {
              self.createBee(h.team, h, 'drone', h.x, h.y);
              h.pollen -= beesConfig.cost.drone;
              return;
            }
          }

        });

        //Periodically check for intruders
        var checkingIntruders = false;
        lastIntruderCheck = lastIntruderCheck + (delta || 1);
        if (lastIntruderCheck > beesConfig.intrudercheck) {
          checkingIntruders = true;
          lastIntruderCheck = 0;
        }

        if (checkingIntruders) {
          self.teams.forEach(function(t) {
            if (t.intruders.length > 0) {
              var filtered = t.intruders
              .map(function(i){
                return _(self.bees).find({
                  id: i.id
                });
              })
              .filter(function(i) {
                if(!i) return false;

                return i.life > 0 && self.territories.findTerritory(i.x, i.y) == t.team;
              });

              console.log(t.intruders.length, filtered.length)

              t.intruders = filtered;
            }
          });
        }

        self.bees
          .forEach(function(b) {

            if (checkingIntruders) {
              var terr = self.territories.findTerritory(b.x, b.y);
              var team = self.teams[terr];

              //bee is in the wrong territory
              if (terr !== b.team) {
                if (team) {
                  var intruder = false;

                  team.intruders.forEach(function(i) {
                    if (i.id == b.id) {
                      intruder = true;
                      i = b;
                    }
                  });

                  if (!intruder) {
                    team.intruders.push(b);
                  }
                }
              }
            }


            if (b.dx < 0) b.dx = 0;
            if (b.dy < 0) b.dy = 0;
            if (b.dx > beesConfig.width) b.dx = beesConfig.width;
            if (b.dy > beesConfig.height) b.dy = beesConfig.height;

            //Move the bee
            if (Math.abs(b.x - b.dx) > beesConfig.precision || Math.abs(b.y - b.dy) > beesConfig.precision) {
              var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
              var newX = b.x + (((b.dx - b.x) / length) * beesConfig.speeds[b.type] * (delta || 1));
              var newY = b.y + (((b.dy - b.y) / length) * beesConfig.speeds[b.type] * (delta || 1));

              //Clamp the travel to prevent overshoot
              if (distance(b.x, b.y, b.dx, b.dy) > distance(newX, newY, b.dx, b.dy)) {
                b.x = newX;
                b.y = newY;
              } else {
                b.x = b.dx;
                b.y = b.dy;
              }
            } else {
              if (b.goal == 'takeLand') {
                if (self.createHive(b.team, b.x, b.y, b.pollen / 2)) {
                  b.life = -1;
                  b.goal = undefined;
                }

                return;
              } else if (b.goal == 'buildHive') {
                if (self.teams[b.team].drones > 3) {
                  //if this bee intersects any other hives -> go home
                  if (self.hives.filter(function(h) {
                      return h.team == b.team;
                    }).filter(function(h) {
                      return compare(b, h)
                    }).length > 0) {
                    gohomebee(b);
                    return;
                  }

                  if (self.createHive(b.team, b.x, b.y, b.pollen / 2)) {
                    b.life = -1;
                  }

                  return;
                } else {
                  gohomebee(b);
                  return;
                }

              }
            }
          });

        //self.checkCollision(e.data.delta);
        defer.resolve();
        defer = undefined;
      }, false);

      self.update = function(delta) {
        if (defer !== undefined) return;
        if (!delta) {
          delta = 1;
        }

        defer = $q.defer();

        //Remove dead stuff
        self.bees = self.bees.filter(checklife);
        self.hives = self.hives.filter(checklife);
        self.flowers = self.flowers.filter(checklife);

        worker.postMessage({
          bees: self.bees,
          hives: self.hives,
          flowers: self.flowers,
          teams: self.teams,
          delta: delta,
          config: config,
          timestamp: _.now()
        });

        return defer.promise;
      };

    }
  ]);

})(angular.module('frontsApp'));
