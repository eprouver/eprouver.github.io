self.addEventListener('message', function(e) {
  var beesData = e.data;

  beesData.createFlower = false;
  beesData.createBees = [];

  var delta = e.data.delta;
  var beesConfig = e.data.config;

  var beeslength;
  var hivelength;
  var soldiers;

  var gohomebee = function(b) {
    b.goal = undefined;
    b.dx = b.home.x;
    b.dy = b.home.y;
    return;
  }

  function checklife(b) {
    return b.life > 0
  };

  //distance between two points
  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  //update flower -> grow more pollen
  beesData.flowers.forEach(function(f) {
    if (f.pollen <= beesConfig.startPollen.flower) {
      f.pollen += beesConfig.flower.regrow * delta;
    }
  });

  var pollen = beesData.flowers.reduce(function(o, n) {
    return o + n.pollen
  }, 0);
  if (pollen < beesData.teams.length * beesConfig.scarcity) {
    beesData.createFlower = true;
  }

  //If the bees have changed update bees;
  //same for hives
  var updatebees = false;
  var updatehives = false;
  if (beesData.bees.length != beeslength) {
    beeslength = beesData.bees.length;
    updatebees = true;
  }
  if (beesData.hives.length != hivelength) {
    hivelength = beesData.hives.length;
    updatehives = true;
  }

  //update teams
  beesData.teams.forEach(function(t) {
    t.intruders = t.intruders.filter(checklife);

    if (updatebees) {
      //how many soldiers and drones do we have?
      t.soldiers = beesData.bees.filter(function(b) {
        return b.team == t.team && b.type == 'soldier'
      }).length;
      t.drones = beesData.bees.filter(function(b) {
        return b.team == t.team && b.type == 'drone'
      }).length;
    }

    if (updatehives) {
      //How many hives do we have?
      t.hives = beesData.hives.filter(function(b) {
        return b.team == t.team
      }).length;
    }

    //Find intruders to attack
    beesData.bees.filter(function(b) {
      return b.team == t.team;
    }).filter(function(b) {
      return b.type == 'soldier';
    }).forEach(function(b) {

      //heal yourbeesData a bit
      if (b.life < beesConfig.life.drone) {
        b.life += beesConfig.bee.repair * delta;
      }

      //If your target is dead, go back home
      if (b.target) {
        if (b.target.life <= 0) {
          b.target = undefined;
          gohomebee(b);
          return;
        }
      }

      //If you don't have a target get one;
      if (b.target == undefined) {
        b.target = t.intruders[0];

        //Found an intruder?
        if (b.target) {
          b.dx = b.target.x;
          b.dy = b.target.y;
          return;
        } else if (b.team != beesConfig.player && beesData.teams[b.team].soldiers > 3) {
          //Find a weaker team to attack (or any team);
          var weak = beesData.teams.filter(function(t) {
            return t.team != b.team;
          }).map(function(t) {
            return t.team;
          });

          if (weak.length) {
            weak = beesData.hives.filter(function(h) {
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
          if (b.team == beesConfig.player) {
            return;
          }

          //if you are attacking a hive, but an intruder is found, go after them
          if (t.intruders.length && t.team) {
            b.target = undefined;
          }
        }

        if (t.intruders.indexOf(b.target) == -1) {
          //My target left my territory
          b.dx = b.x;
          b.dy = b.y;
          b.target = undefined;
          return;
        } else if (b.target.life <= 0) {
          //My target has died
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
  var readytargets = beesData.flowers.filter(function(f) {
    return f.pollen > beesConfig.minpollen;
  });

  var ourtargets = beesData.teams.map(function(t, i) {
    return readytargets.filter(function(f) {
      return f.team == i;
    });
  });

  //drone things
  beesData.bees.filter(function(b) {
    return b.type == 'drone';
  }).filter(function(b) {
    //heal yourbeesData
    if (b.life < beesConfig.life.drone) {
      b.life += beesConfig.bee.repair * delta;
    }

    //If you have full pollen, or the flower is dead, move to next filter
    if (b.target) {
      if (b.target.pollen <= beesConfig.minpollen) {
        b.target = undefined;
      } else if (b.target.life <= 0) {
        b.target = undefined;
      }
    }

    return b.target == undefined;
  }).filter(function(b) {
    //User interaction trumps ai
    if (b.goal == 'user') return;

    //Find a pretty flower
    //first in my territory, then anywhere else
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
        return (distance(b.x, b.y, one.x, one.y) / (one.pollen / beesConfig.maxpollen)) - (distance(b.x, b.y, two.x, two.y) / (two.pollen / beesConfig.maxpollen));
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
    soldiers = beesData.bees.filter(function(b) {
      return b.type == 'soldier'
    }).length;
  }

  //update hives
  beesData.hives.forEach(function(h) {
    if (h.life < beesConfig.life.hive) {
      h.life += beesConfig.hive.repair * delta;
    }

    //if you have no pollen subtract life
    //else subtract a little pollen
    if (h.pollen <= 0) {
      h.pollen = 0;
      h.life -= (beesConfig.hive.repair + beesConfig.hive.cost) * delta;
    } else {
      h.pollen -= beesConfig.hive.cost * delta;
    }
  })

  self.postMessage(beesData);
}, false);
