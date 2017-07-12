(function(module) {
  var testingtime = 1.75;

  var worker = new Worker('workers/bees.js');
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

      if (!dest) {
        this[type].push(a);
      }

      if (a.costs > 0) {
        a.pollen = a.pollen - a.costs;
        a.costs = 0;
      }

      return _.extend(dest, a);
    }
  })

  module.service('beesConfig', function() {
    return {
      player: -1,
      players: 3,
      height: window.innerHeight,
      width: window.innerWidth,
      flowers: 15,
      scarcity: 300,
      precision: 1,
      hiveLust: 0.58,
      //colors: d3.scale.category10().domain(d3.range(10)),
      colors: d3.scale.ordinal().domain(d3.range(10)).range(["#ff4336", "#EC407A", "#7C4DFF", "#2196f3", "#10bcd4", "#4caf50", "#C6FF00", "#ffeb3b", "#ff9800", "#795548", "#9e9e9e", "#607d8b"].sort(function() {
        return Math.random() - 0.5
      })),
      pollenRate: 1 * testingtime,
      usePixi: true,
      beeTheme: true,
      speeds: {
        drone: 0.3 * testingtime,
        soldier: 0.1 * testingtime
      },
      cost: {
        drone: 100,
        soldier: 2000
      },
      minpollen: 30,
      maxpollen: 170,
      maxtravel: 0.05,
      dronePercentage: 0.6,
      life: {
        drone: 6,
        hive: 400,
        soldier: 100
      },
      damage: {
        drone: 0.05 * testingtime,
        hive: 0.275 * testingtime,
        soldier: 0.25 * testingtime,
        injury: 0.1 * testingtime
      },
      bee: {
        height: 50,
        width: 50,
        repair: 0.001 * testingtime,
        idle: 500
      },
      hive: {
        height: 60,
        width: 60,
        repair: 0.005,
        cost: 0.005 * testingtime,
        upkeepDamage: 0.05
      },
      flower: {
        height: 20,
        width: 20,
        regrow: 0.001 * testingtime
      },
      intrudercheck: 10,
      startPollen: {
        hive: 120,
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
          x: ~~(random() * beesConfig.width),
          y: ~~(random() * beesConfig.height),
          h: beesConfig.flower.height,
          w: beesConfig.flower.width,
          type: type,
          pollen: beesConfig.startPollen.flower,
          life: 1,
          targetScale: beesConfig.beeTheme ? 2 : 1,
          transitionTime: 0,
          team: -1,
          rotate: 0,
          currentRotation: 0
        });

        setTimeout(self.updateFlowers, 200);
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
          maxPollen: beesConfig.maxpollen,
          targetScale: 1,
          transitionTime: 0,
          rotate: 0,
          currentRotation: 0
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
          maxLife: beesConfig.life.hive,
          pollen: pollen || 0,
          type: 'hive',
          costs: 0,
          targetScale: 1,
          rotate: ~~(Math.random() * Math.PI * 2),
          transitionTime: 0
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

        setTimeout(function() {
          //Update the location of each flower (which territory is it in?)
          _(self.flowers).each(function(f) {
            var team = self.territories.findTerritory(f.x, f.y);

            if (team !== undefined && team != f.team) {
              f.team = team;
              f.transitionTime = 1;
            }
          });
        }, 200)

      };

      var lastTimestamp = 0;
      var lastIntruderCheck = 0;

      var gohomebee = function(b) {
        b.goal = undefined;

        b.home = self.hives.filter(function(h) {
          return h.team == b.team
        }).sort(function(f, s) {
          return distance(b.x, b.y, f.x, f.y) - distance(b.x, b.y, s.x, s.y)
        })[0];

        if (!b.home) {
          if (b.pollen > beesConfig.cost.drone * 2) {
            b.goal = 'takeLand';
          }
          return;
        }

        b.dx = b.home.x;
        b.dy = b.home.y;
        b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy || 0));

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

        e.data.hives.map(function(v) {
          updateFields.apply(self, [v, 'hives']);
        })

        e.data.bees.forEach(function(v) {
          if (v.goal == 'user') {
            var me = _(self.bees).find({
              id: v.id
            });
            me.life = v.life;
          } else {
            updateFields.apply(self, [v, 'bees']);
          }
        })

        self.flowers = e.data.flowers;
        //self.hives = e.data.hives;
        //self.bees = e.data.bees;

        self.teams = e.data.teams;

        var delta = e.data.delta;

        if (e.data.createFlower) {
          self.createFlower('flower');
        }

        //Should Hives send out more bees?
        _.chain(self.hives).filter(function(h) {
          return h.team != beesConfig.player;
        }).filter(function(h) {
          return h.costs <= 0;
        }).each(function(h) {
          var team = self.teams[h.team];

          if (team.drones < team.hives && h.pollen > beesConfig.cost.drone) {
            self.createBee(h.team, h, 'drone', h.x, h.y);
            h.costs += beesConfig.cost.drone;
            return;
          }

          //If there aren't enough soldiers, make one first
          //else make a drone if you can offordone
          else if (team.soldiers < (team.drones * beesConfig.dronePercentage)) {
            if (h.pollen > beesConfig.cost.soldier) {
              self.createBee(h.team, h, 'soldier', h.x, h.y);
              h.costs += beesConfig.cost.soldier;
              return;
            }
          } else {
            if (h.pollen > beesConfig.cost.drone) {
              self.createBee(h.team, h, 'drone', h.x, h.y);
              h.costs += beesConfig.cost.drone;
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
          _(self.teams).forEach(function(t) {
            if (t.intruders.length > 0) {
              var filtered = t.intruders
                .map(function(i) {
                  return _(self.bees).find({
                    id: i.id
                  });
                })
                .filter(function(i) {
                  if (!i) return false;

                  return i.life > 0 && self.territories.findTerritory(i.x, i.y) == t.team;
                });

              t.intruders = filtered;
            }
          });
        }

        _(self.bees)
          .each(function(b) {

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

            var target = Math.abs(b.rotate - b.currentRotation);

            if (target > 0.1) {
              var direction = Math.cos(b.currentRotation) * Math.sin(b.rotate) - Math.cos(b.rotate) * Math.sin(b.currentRotation);
              if (direction >= 0 && b.currentRotation <= b.rotate) {
                //clockwise
                b.currentRotation = b.currentRotation + 0.0025 * delta;

              } else if (direction < 0 && b.currentRotation >= b.rotate) {
                //counterclockwise
                b.currentRotation = b.currentRotation - 0.0025 * delta;
              } else {
                b.currentRotation = d3.interpolateNumber(b.currentRotation || 0, b.rotate || 0)(0.0005 * delta);

              }

              if (!b.currentRotation) {
                b.currentRotation = 0;
                b.rotate = 0;
              }
            }

            //Move the bee
            if (Math.abs(b.x - b.dx) > beesConfig.precision || Math.abs(b.y - b.dy) > beesConfig.precision) {
              b.idle = 0;
              var turning = (2 * Math.PI - Math.abs((b.rotate || 0) - (b.currentRotation || 0))) / (2 * Math.PI);
              var turning2 = Math.pow(turning, 4);

              var length = Math.sqrt((b.dx - b.x) * (b.dx - b.x) + (b.dy - b.y) * (b.dy - b.y));
              var newX = b.x + (((b.dx - b.x) / length) * beesConfig.speeds[b.type] * (delta || 1)) * turning2;
              var newY = b.y + (((b.dy - b.y) / length) * beesConfig.speeds[b.type] * (delta || 1)) * turning2;

              //Clamp the travel to prevent overshoot
              if (distance(b.x, b.y, b.dx, b.dy) > distance(newX, newY, b.dx, b.dy)) {
                //b.x = newX + -Math.sin(b.currentRotation) * delta * 0.045 / Math.max(turning, 1);
                //b.y = newY + Math.sin(b.currentRotation) * delta * 0.045 / Math.max(turning, 1);
                b.x = newX;
                b.y = newY;


              } else {
                b.x = b.dx;
                b.y = b.dy;
              }

            } else {
              b.idle = (b.idle || 0) + (1 * delta);

              if (b.idle > beesConfig.bee.idle) {
                gohomebee(b);
                return;
              }

              if (b.goal == 'takeLand') {
                if (self.createHive(b.team, b.x, b.y, b.pollen / 2)) {
                  b.life = -1;
                  b.goal = undefined;
                } else {
                  gohomebee(b);
                }

                return;
              } else if (b.goal == 'buildHive') {
                if (self.teams[b.team].drones >= (self.teams[b.team].hives / beesConfig.hiveLust)) {
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
                  gohomebee(b);
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


      function removeSprite(v, depth) {
        var transfer = {};

        for (var i in v) {
          //TODO REPLACE HOME TARGET AND INTRUDERS WITH IDS
          if (i == 'home' || i == 'target') {

            if (!depth) {
              transfer[i] = removeSprite(v[i], 1);
            }
            continue;
          }

          if (i == 'intruders') {
            if (!depth) {
              transfer[i] = v[i].map(function(b) {
                return removeSprite(b, 0);
              });
            }
            continue;
          }

          if (i !== 'sprite') {
            transfer[i] = v[i];
          }
        }

        return transfer;
      }

      self.update = function(delta) {
        if (defer !== undefined) return;
        if (!delta) {
          delta = 1;
        }

        defer = $q.defer();

        //Remove dead stuff
        self.bees = _(self.bees).filter(checklife);
        self.hives = _(self.hives).filter(checklife);
        self.flowers = _(self.flowers).filter(checklife);

        //update moving targets
        _.chain(self.bees).filter(function(b) {
          return b.type == 'soldier';
        }).filter(function(b) {
          return b.target && b.target.type;
        }).each(function(b) {
          if (b.target.type == 'hive') {
            b.target = _(self.hives).find({
              id: b.target.id
            });
          } else {
            b.target = _(self.bees).find({
              id: b.target.id
            });
          }

        })

        try {
          var transfer = JSON.stringify({
            bees: self.bees.map(function(b) {
              return removeSprite(b);
            }),
            hives: self.hives.map(function(b) {
              return removeSprite(b);
            }),
            flowers: self.flowers.map(function(b) {
              return removeSprite(b);
            }),
            teams: self.teams.map(function(b) {
              return removeSprite(b);
            }),
            delta: delta,
            config: config,
            timestamp: _.now()
          });
        } catch (e) {
          debugger;
          console.error(e);
          return $q.reject();
        }

        worker.postMessage(transfer);

        return defer.promise;
      };

    }
  ]);

})(angular.module('frontsApp'));
