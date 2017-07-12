
self.addEventListener('message', function(e) {
  var beesData = JSON.parse(e.data);

  beesData.createFlower = false;
  beesData.createBees = [];

  var delta = beesData.delta;
  var beesConfig = beesData.config;

  var beeslength;
  var hivelength;
  var soldiers;

  var gohomebee = function(b) {
    b.goal = undefined;

    b.home = beesData.hives.filter(function(h) {
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

  function checklife(b) {
    return b.life > 0
  };

  function compare(a, b) {
    var ax = a.x - (a.w / 2),
      bx = b.x - (b.w / 2),
      ay = a.y - (a.h / 2),
      by = b.y - (b.h / 2);

    return (ax < bx + b.w &&
      ax + a.w > bx &&
      ay < by + b.h &&
      a.h + ay > by)
  }

  //distance between two points
  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  //Random unit vector
  function randomVector() {
    var x = Math.random() - 0.5;
    var y = Math.random() - 0.5;
    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return [x / dist, y / dist]
  };

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
        if(b.target.id == undefined){
          b.target = undefined;
        }else if (b.target.life <= 0) {
          console.log('target dead')
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
          b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
          return;
        } else if (b.team != beesConfig.player && beesData.teams[b.team].soldiers > Math.max(beesData.teams[b.team].hives, 3)) {
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
              b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
            }

          }

        }

      } else {
        if (b.target.type == 'hive') {
          if (b.team == beesConfig.player) {
            return;
          }

          //if you are attacking a hive, but an intruder is found, go after them
          if (t.intruders.length) {
            b.target = t.intruders[0];
          }
        }

        if (t.intruders.map(function(v){return v.id}).indexOf(b.target.id) == -1 && beesData.teams[b.team].soldiers <=  Math.max(beesData.teams[b.team].hives, 3)) {
          //My target left my territory
          b.dx = b.x;
          b.dy = b.y;
          b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
          b.target = undefined;
          gohomebee(b);
          return;
        }else{
          b.dx = b.target.x;
          b.dy = b.target.y;
          b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
        }


      }
    });
  });






  /*  Check Collision Starts Here  */

  //if a hive is over a flower, kill the flower
  beesData.flowers.forEach(function(f) {
    if (beesData.hives.filter(function(h) {
        return compare(f, h)
      }).length > 0) {
      f.life = -1;
    }
  });


  beesData.hives.forEach(function(h1) {
    if (h1.life < beesConfig.life.hive) {
      h1.life += beesConfig.hive.repair * delta;
    }

    if(!beesConfig.beeTheme){
      h1.currentRotation += 0.00025 * delta;
    }

    //if you have no pollen subtract life
    //else subtract a little pollen
    if (h1.pollen <= 0) {
      h1.pollen = 0;
      h1.life -= (beesConfig.hive.upkeepDamage) * delta;
    } else {
      h1.pollen -= beesConfig.hive.cost * delta;
    }

    beesData.hives.forEach(function(h2) {
      if (h1 == h2) return;
      //if the hive is dead, ignore it
      if (h1.life <= 0 || h2.life <= 0) return;

      if (compare(h1, h2)) {

        //If hives from two teams are touching, fight
        if (Math.random() > 0.5) {
          h1.life -= beesConfig.damage.hive * delta;
        }
        if (Math.random() > 0.5) {
          h1.life -= beesConfig.damage.hive * delta;
        }
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

  function findFlower(b) {
    //Find a pretty flower
    //first in my territory, then anywhere else
    if (ourtargets[b.team].length) {
      b.target = ourtargets[b.team].sort(function(two, one) {
        return ((one.pollen - beesConfig.minpollen) / distance(b.x, b.y, one.x, one.y) ) - ((two.pollen - beesConfig.minpollen) / distance(b.x, b.y, two.x, two.y));
      })[0];
      if (b.target) {
        b.dx = b.target.x;
        b.dy = b.target.y;
        b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
      }
      return;
    } else if (readytargets.length) {
      b.target = readytargets.sort(function(two, one) {
        return ((one.pollen - beesConfig.minpollen) / distance(b.x, b.y, one.x, one.y) ) - ((two.pollen - beesConfig.minpollen) / distance(b.x, b.y, two.x, two.y));
      })[0]
      if (b.target) {
        b.dx = b.target.x;
        b.dy = b.target.y;
        b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
      }
      return;
    } else {
      if (b.home) {
        gohomebee(b);
        return;
      }
    }
  }

  var heal = function(b){
    //heal yourbeesData
    if (b.life < beesConfig.life[b.type]) {
      b.life += beesConfig.bee.repair * delta * beesConfig.life[b.type];
    }
  }

  //drone collisions
  beesData.bees.filter(checklife).forEach(function(b) {

    switch (b.type) {
      case 'drone':
        if (b.goal != 'user') {

          if (b.target) {
            if (b.target.pollen <= beesConfig.minpollen) {
              b.target = undefined;
            } else if (b.target.life <= 0) {
              b.target = undefined;
            }
          }

          if (!b.target) {
            findFlower(b);
          }
        }
        //see if colliding with my hives
        beesData.hives.filter(checklife).filter(function(h) {
          return b.team == h.team;
        }).forEach(function(h) {
          //if drone hits home update home
          if (compare(b, h)) {
            heal(b);

            if (h != b.home) {
              b.home = h;
            };

            //if the bee has pollen deposit it
            if (b.pollen > 0) {
              h.pollen += Math.min(beesConfig.pollenRate * delta, b.pollen);
              b.pollen -= beesConfig.pollenRate * delta;

              if (b.pollen < 0) b.pollen = 0;
            } else {
              findFlower(b)
            }
          }
        });

        //if colliding with a flower add pollen
        beesData.flowers.forEach(function(f) {
          if (f.pollen <= beesConfig.startPollen.flower) {
            f.pollen += beesConfig.flower.regrow * delta;
          }

          if (compare(b, f)) {
            if (b.goal == 'user') return;
            b.goal = undefined;
            if (f.pollen <= 0) {
              return;
            }

            //If the flower has pollen stick around
            if (b.pollen < beesConfig.maxpollen && f.pollen > 0) {

              //If this flower is not mine / claim it
              if (b.team !== beesConfig.player) {
                if (f.team !== b.team && (beesData.teams[b.team].drones - 1) > beesData.teams[b.team].hives) {
                  b.goal = 'takeLand';
                  var loc = randomVector();

                  b.dx = f.x + (beesConfig.hive.width * 2 * loc[0]);
                  b.dy = f.y + (beesConfig.hive.height * 2 * loc[1]);
                  b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
                }
              }

              b.pollen += Math.min(f.pollen, beesConfig.pollenRate * delta);
              f.pollen -= beesConfig.pollenRate * delta;
              if (f.pollen <= 0) {
                f.pollen = 0;
              }
              return;
            } else {
              if (b.target == undefined) {
                b.target = f;
              }

              b.home = beesData.hives.filter(function(h) {
                return h.team == b.team;
              }).sort(function(one, two) {
                return distance(one.x, one.y, b.x, b.y) - distance(two.x, two.y, b.x, b.y);
              })[0]

              if (!b.home) {
                b.goal = 'buildHive';
                b.home = b;
                return;
              }

              //if you are far from home, build a new home
              if (b.team !== beesConfig.player) {
                if (distance(b.x, b.y, b.home.x, b.home.y) > (beesConfig.width + beesConfig.height) * (0.5 * beesConfig.maxtravel)) {
                  b.goal = 'buildHive';
                  var x = b.home.x - b.x;
                  var y = b.home.y - b.y;
                  var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                  b.dx = b.x + (x / dist) * beesConfig.hive.width * 2;
                  b.dy = b.y + (y / dist) * beesConfig.hive.height * 2;
                  b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
                  return;
                }
              }

              //go home
              b.dx = b.home.x;
              b.dy = b.home.y;
              b.rotate = Math.PI - Math.atan2(b.x - (b.dx || 0), b.y - (b.dy|| 0));
              return;
            }
          }
        })
        break;

      case 'soldier':
        beesData.bees.filter(checklife).filter(function(ob) {
          //only collide with other teams
          return ob.team !== b.team;
        }).forEach(function(ob) {
          b.home = beesData.hives.filter(function(h) {
            return h.team == b.team;
          }).sort(function(one, two) {
            return distance(one.x, one.y, b.x, b.y) - distance(two.x, two.y, b.x, b.y);
          })[0]

          if (compare(b, ob)) {
            //If you've hit a soldier, make that your target
            if (ob.type == 'soldier') {
              b.target = ob;
            }

            //Fight
            if (Math.random() > 0.25) {
              ob.life -= beesConfig.damage[ob.type] * delta;
            }

            //Injury
            if (Math.random() > 0.75) {
              b.life -= beesConfig.damage.injury * delta;
            }
          }
        })

        //If fighting a hive?
        beesData.hives.filter(checklife).forEach(function(ob) {
          if(b.team == ob.team){
            if(distance(b.x, b.y, ob.x, ob.y) < 5){
              heal(b);
            }
            return;
          }

          if (compare(b, ob)) {
            //Fight
            if (Math.random() > 0.5) {
              ob.life -= beesConfig.damage.hive * delta;
            }

            //Injury
            if (Math.random() > 0.75) {
              b.life -= beesConfig.damage.injury * delta;
            }
          }
        })
        break;
    }
  })

  self.postMessage(beesData);
}, false);
