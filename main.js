var DEBUG_FLAGS = {
    verboseLogging: false,
    motionBlurRender: {
        enabled: false,
        intensity: 0.2
    },
    drawFrameCount: false,
    debugDraw: false
}

var device = {
    ctx: null,
    width: 1400,
    height: 900,
    drawScale: 30
}

var peg, bag, playsfx = true, playtheme = false, cups=[];
var cupimg = new Image();
cupimg.src = './img/cup.png';

var level = levels[0], currentLevel = 0;

var teaImageObj = new Image();
teaImageObj.src = './img/bag-1.png';

var background = new Image();
background.src = './img/background.png';

var sugarCubeObj = new Image();
sugarCubeObj.src = './img/sugarcube.jpeg';

var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2AABB = Box2D.Collision.b2AABB,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
      b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef,
      b2ContactListener = Box2D.Dynamics.b2ContactListener,
      b2Math = Box2D.Common.Math.b2Math;

var world = new b2World(
      new b2Vec2(0, 10) //gravity
      , true //allow sleep
);
var frame = 0;
var pegs = [];
var objectsToBeDeleted = [];

var fixDef = new b2FixtureDef;
fixDef.density = 1.0;
fixDef.friction = 0.5;
fixDef.restitution = 0.4;
var drawLevel;

var bodyDef = new b2BodyDef;

    function flagForDeletion(obj) {
        objectsToBeDeleted.push(obj);
    }

    function processObjectsForDeletion() {
        for ( var i = objectsToBeDeleted.length-1; i >= 0; i-- ) {
            world.DestroyBody(objectsToBeDeleted[i]);
        }
        objectsToBeDeleted = [];
    }

/*
 * Collision Listener object
 */
function ContactListener() {
    this.listeners = [];
};
ContactListener.prototype = Object.create(b2ContactListener.prototype);
ContactListener.prototype.constructor = ContactListener;

ContactListener.prototype.on = function(body, listener) {
    this.listeners.push({"body": body, "once": false, "listener": listener});
}

ContactListener.prototype.once = function(body, listener) {
    this.listeners.push({"body": body, "once": true, "listener": listener});
}

function whichbody(type, a, b){
  if(a.m_userData.type === type){
    return a;
  }else if(b.m_userData.type === type){
    return b;
  }
}

ContactListener.prototype.notify = function(body, otherBody) {
    var listener;

    var bag = whichbody('bag', body, otherBody);
    var cup = whichbody('bottom', body, otherBody);

    if(bag && cup){
      flagForDeletion(bag);
    }

    for ( var i = 0, len = this.listeners.length; i < len; i++ ) {
        if ( body == this.listeners[i].body || otherBody == this.listeners[i].body ) {
            listener = this.listeners[i].listener;
            // remove the listener if its a 'once-off'
            if ( this.listeners[i].once ) {
                this.listeners.splice(i--);
            }
            listener(this.listeners[i].body);
        }
    }
}

var contactListener = new ContactListener();

contactListener.BeginContact = function(contact) {
    if ( DEBUG_FLAGS.verboseLogging ) {
        console.log('BeginContact');
        console.log(contact);
    }

    this.notify(contact.m_fixtureA.m_body, contact.m_fixtureB.m_body);
}

contactListener.EndContact = function(contact) {
    if ( DEBUG_FLAGS.verboseLogging ) {
        console.log('EndContact');
        console.log(contact);
    }
}

function drawWall(body) {
    var fixture = body.m_fixtureList;
    if(fixture.GetShape() instanceof b2CircleShape) return;
    var pos = body.GetPosition();
    var verts = fixture.GetShape().GetVertices();

    //device.ctx.save();
    //device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
    //device.ctx.fillStyle = 'rgb(255, 0, 0)';
    // device.ctx.fillRect(
    //     device.drawScale * verts[0].x,
    //     device.drawScale * verts[0].y,
    //     device.drawScale * verts[2].x - device.drawScale * verts[0].x,
    //     device.drawScale * verts[2].y - device.drawScale * verts[0].y
    // );
    // device.ctx.restore();
}

function drawPeg(body) {
    var fixture = body.m_fixtureList;

    var pos = body.GetPosition();
    var radius = fixture.GetShape().GetRadius();

    device.ctx.save();
    device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
    device.ctx.fillStyle = 'rgb(255, 128, 128)';
    device.ctx.beginPath();
    device.ctx.arc(0, 0, radius*device.drawScale, 0, 2 * Math.PI, false);
    device.ctx.fill();
    device.ctx.restore();
}

function drawPlatform(body) {
    var fixture = body.m_fixtureList;
    if(fixture.GetShape() instanceof b2CircleShape) return;
    var pos = body.GetPosition();
    var localverts = fixture.GetShape().GetVertices();
    var verts = [];

    for ( var v = 0, len = localverts.length; v < len; v++ ) {
        verts[v] = b2Math.MulX(body.m_xf, localverts[v]);
    }

    device.ctx.save();
    device.ctx.fillStyle = '#5f7fa3';
    device.ctx.beginPath();
    device.ctx.moveTo(verts[0].x * device.drawScale, verts[0].y * device.drawScale);
    for ( v = 1; v < len; v++ ) {
        device.ctx.lineTo(verts[v].x * device.drawScale, verts[v].y * device.drawScale);
    }
    device.ctx.lineTo(verts[0].x * device.drawScale, verts[0].y * device.drawScale);
    device.ctx.closePath();
    device.ctx.fill();
    device.ctx.restore();
}

function drawBall(body) {
    var fixture = body.m_fixtureList;
    var pos = body.GetPosition();
    var radius = fixture.GetShape().GetRadius();

    device.ctx.save();
    device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
    device.ctx.fillStyle = '#5f7fa3';
    device.ctx.strokeStyle = '#5f7fa3';
    device.ctx.beginPath();
    device.ctx.arc(0, 0, radius*device.drawScale, 0, 2 * Math.PI, false);
    device.ctx.fill();
    device.ctx.stroke();
    device.ctx.restore();
}

function drawTeabag(body) {
    var fixture = body.m_fixtureList;
    var pos = body.GetPosition();
    var radius = fixture.GetShape().GetRadius();

    device.ctx.save();
    device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
    device.ctx.rotate(body.GetAngle() - 30);
    device.ctx.drawImage(teaImageObj, -(teaImageObj.width / 2),-(teaImageObj.height / 2))
    device.ctx.restore();
}

function drawCup(body) {
    var fixture = body.m_fixtureList;
    var pos = body.GetPosition();
    var verts = fixture.GetShape().GetVertices();

    if ( DEBUG_FLAGS.debugDraw ) {
        device.ctx.save();
        device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
        device.ctx.rotate(body.GetAngle());
        device.ctx.fillStyle = 'green';
        device.ctx.fillRect(
            device.drawScale * verts[0].x,
            device.drawScale * verts[0].y,
            device.drawScale * verts[2].x - device.drawScale * verts[0].x,
            device.drawScale * verts[2].y - device.drawScale * verts[0].y
        );
        device.ctx.restore();
    }

    device.ctx.save();
    //device.ctx.globalAlpha = 0.5;
    for (var i = 0; i < cups.length; i++) {
      device.ctx.drawImage(cupimg, 0, 0, cupimg.width, cupimg.height, (cups[i].m_body.m_xf.position.x - 8.4) * device.drawScale, (cups[i].m_body.m_xf.position.y - 6) * device.drawScale, cupimg.width, cupimg.height);
    }
    device.ctx.restore();
}

function drawCollectible(body) {
    var fixture = body.m_fixtureList;
    var pos = body.GetPosition();
    var verts = fixture.GetShape().GetVertices();
    var w = (verts[2].x - verts[0].x) * device.drawScale;
    var h = (verts[2].y - verts[0].y) * device.drawScale;

    device.ctx.save();
    device.ctx.translate(pos.x * device.drawScale, pos.y * device.drawScale);
    device.ctx.scale(w / sugarCubeObj.width, h / sugarCubeObj.height);
    device.ctx.rotate(body.GetAngle());
    device.ctx.drawImage(sugarCubeObj, -(sugarCubeObj.width/2), -(sugarCubeObj.height/2));
    device.ctx.restore();
}

// Call defined on html onclick in index.html -- DO NOT DELETE (again)
function addBag() {

	//create the bag
	bag = new b2BodyDef;
	bag.type = b2Body.b2_dynamicBody;
	fixDef.shape = new b2CircleShape(2);
  fixDef.type = 'bag';
	bag.position.x = 15;
	bag.position.y = 1;
    bag.userData = { render: drawTeabag, type:'bag' };
	bag = world.CreateBody(bag).CreateFixture(fixDef);
  bag.m_body.type = 'bag';

	var md = new b2MouseJointDef();
	md.bodyA = peg.m_body;
	md.bodyB = bag.m_body;
	md.target.Set(peg.m_body.m_xf.position.x, peg.m_body.m_xf.position.y);
	md.collideConnected = true;
	md.maxForce = 400;
	bag.m_body.string = world.CreateJoint(md);
}

function init() {
      var map;

      // create the world's contact listener
      world.SetContactListener(contactListener);

      bodyDef.type = b2Body.b2_kinematicBody;
//      fixDef.shape = new b2CircleShape(0.4);
      // for (var i = 1; i < 10; ++i) {
      //       for (var j = 0; j < 3; j++) {
      //             fixDef.shape = new b2CircleShape(
      //                   0.3 //radius
      //             );

      //             bodyDef.position.x = i * 4.2;
      //             bodyDef.position.y = (j % 40)* 3 + 10;
      //             map = world.CreateBody(bodyDef).CreateFixture(fixDef);

      //             if(j% 2){
      //                   map.m_body.SetLinearVelocity (new b2Vec2(2, 0));
      //             }else{
      //                   map.m_body.SetLinearVelocity (new b2Vec2(-2, 0));
      //             }

      //             pegs.push(map);
      //       }
      // }

      function addc(s){
            fixDef.shape = new b2CircleShape(
                  s.radius || 1//radius
            );  

            bodyDef.position.x = s.position.x;
            bodyDef.position.y = s.position.y;

          bodyDef.userData = { render: drawBall};
          map = world.CreateBody(bodyDef).CreateFixture(fixDef);
            map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y));    

            s.fixture = map;      
            if(s.av){
              s.fixture.m_body.SetAngularVelocity(s.av);
            }

            contactListener.on(map.m_body, function(body) {
              if(playsfx){
                sfx.pop.play();
              }
            });
      }

      function addb(s){
            fixDef.shape = new b2PolygonShape;
            fixDef.shape.SetAsOrientedBox(s.size.w, s.size.h, 
                  new b2Vec2(s.origin.x,s.origin.y), s.r);

            bodyDef.position.x = s.position.x;
            bodyDef.position.y = s.position.y;

            bodyDef.userData = { render: drawPlatform };
            map = world.CreateBody(bodyDef).CreateFixture(fixDef);
            map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y), s.r);    

            s.fixture = map;      
            if(s.av){
              s.fixture.m_body.SetAngularVelocity(s.av);    
            }

            contactListener.on(map.m_body, function(body) {
              if(playsfx){
                sfx.pop.play();
              }
            });
      }

      function addcup(s){
        var cupbody, map;
            for(var i = 0; i < 4; i++){
                  fixDef.shape = new b2PolygonShape;
                  switch(i){
                        case 0:
                            fixDef.shape.SetAsBox(0.5, 4);    
                            bodyDef.position.x = s.position.x - s.size.w + 0.4;
                            bodyDef.position.y = s.position.y - 3.2;
                            bodyDef.userData = {render: drawCup};
                            map = world.CreateBody(bodyDef).CreateFixture(fixDef);
                            map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y));
                            contactListener.on(map.m_body, function(body) {
                              if (playsfx) {
                                sfx.plate.play();
                              }
                            });
                            s.fixture.push(map);
                        break;
                        case 1:
                            fixDef.restitution = 0;
                            fixDef.shape.SetAsBox(s.size.w - 1.78, 2);   
                            bodyDef.position.x = s.position.x - 1.78;
                            bodyDef.position.y = s.position.y - 1.2;
                            bodyDef.userData = {render: drawCup, type: 'bottom'};
                            map = world.CreateBody(bodyDef).CreateFixture(fixDef);
                            map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y));
                            contactListener.on(map.m_body, function(body) {
                                if(playsfx){
                                  sfx.cup.play();
                                }

                                for(var j = 0; j < 3; j++){
                                setTimeout(function(){
                                  document.getElementById('happy').style.display = 'block';
                                  setTimeout(function(){
                                    document.getElementById('happy').style.display = 'none';
                                  }, 50);  
                                }, Math.random() * 600);   
                                 
                               
                                }

                            });
                            fixDef.restitution = 0.4;
                            cupbody = map;
                            s.fixture.push(map);
                        break;
                        case 2:
                            fixDef.shape.SetAsBox(0.5, 4);   
                            bodyDef.position.x = s.position.x + s.size.w - 4;
                            bodyDef.position.y = s.position.y - 3.2;
                            bodyDef.userData = {render: drawCup};
                            map = world.CreateBody(bodyDef).CreateFixture(fixDef);
                            map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y));
                            contactListener.on(map.m_body, function(body) {
                              if (playsfx) {
                                sfx.plate.play();
                              }
                            });
                            s.fixture.push(map);
                        break;
                        case 3:
                            fixDef.shape.SetAsBox(s.size.w + 1.4, 1.1);
                            bodyDef.position.x = s.position.x - 1.78;
                            bodyDef.position.y = s.position.y - 0.7;
                            bodyDef.userData = {
                              render: drawCup
                            };
                            map = world.CreateBody(bodyDef).CreateFixture(fixDef);
                            map.m_body.SetLinearVelocity(new b2Vec2(s.velocity.x, s.velocity.y));
                            contactListener.on(map.m_body, function(body) {
                              if (playsfx) {
                                sfx.plate.play();
                              }
                            });
                            s.fixture.push(map);
                            break;
                  }
                   
                  if(s.av){
                    s.fixture.m_body.SetAngularVelocity(s.av);    
                  }                      
            }

            return cupbody;
   
      }

    function addCollectible(s) {
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsOrientedBox(s.size.w, s.size.h,
            new b2Vec2(s.origin.x,s.origin.y), s.r);
        fixDef.isSensor = true;

        bodyDef.position.x = s.position.x;
        bodyDef.position.y = s.position.y;
        bodyDef.userData = {render: drawCollectible, collectible: true};

        map = world.CreateBody(bodyDef).CreateFixture(fixDef);
        map.m_body.SetLinearVelocity (new b2Vec2(s.velocity.x, s.velocity.y), s.r);

        contactListener.on(map.m_body, onCollectibleTouched);

        s.fixture = map;
        if(s.av){
            s.fixture.m_body.SetAngularVelocity(s.av);
        }
        fixDef.isSensor = false;

    }

    function onCollectibleTouched(bodyA, bodyB) {
        console.log('collectible touched');
          if(playsfx){
            sfx.collect.play();
          }
        var cObj = bodyA.m_userData.collectible ? bodyA : bodyB;
        flagForDeletion(cObj);
    }

    drawLevel = function(){
            cups = [];
            //create the peg
             bodyDef.type = b2Body.b2_staticBody;
            peg = new b2BodyDef;
            peg.type = b2Body.b2_staticBody;
            fixDef.shape = new b2CircleShape(0.1);
            peg.position.x = 22;
            peg.position.y = 1;
            peg = world.CreateBody(peg).CreateFixture(fixDef);

             bodyDef.type = b2Body.b2_kinematicBody;

            for(var i = 0; i < level.shapes.length; i++){
            switch(level.shapes[i].type){
                  case 'c':
                        addc(level.shapes[i]);
                  break;
                  case 'b':
                        addb(level.shapes[i]);
                  break;
                  case 'cup':
                        level.shapes[i].fixture = [];
                        cups.push(addcup(level.shapes[i]));
                  break;
                case 'collectible':
                    addCollectible(level.shapes[i]);
                    break;
            }
      }
    }
    drawLevel();

      //create ground
      bodyDef.type = b2Body.b2_staticBody;
      //Top bottom limits
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(40, 2);
      fixDef.friction = 1;
      fixDef.restitution = 0;
      bodyDef.position.Set(10, 1200 / device.drawScale + 1.8);
      bodyDef.userData = { render: drawWall, type: 'bottom' };
      var bottom = world.CreateBody(bodyDef).CreateFixture(fixDef);

      contactListener.on(bottom.m_body, function(body) {
        document.getElementById('sad').style.display = 'block';
        setTimeout(function(){
          document.getElementById('sad').style.display = 'none';
        }, 50);
        if(playsfx){
          sfx.no.play();
        }
      });
      fixDef.friction = 0.5;
      fixDef.restitution = 0.4;

      bodyDef.position.Set(10, -1.8);
      bodyDef.userData = { render: drawWall };
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      //Left Right
      fixDef.shape.SetAsBox(2, 18);
      bodyDef.position.Set(-1.8, 17);
      bodyDef.userData = { render: drawWall };
      world.CreateBody(bodyDef).CreateFixture(fixDef);
      bodyDef.position.Set(1400 / device.drawScale + 1.8, 13);
      bodyDef.userData = { render: drawWall };
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      //create the peg
      peg = new b2BodyDef;
      peg.type = b2Body.b2_staticBody;
      fixDef.shape = new b2CircleShape(0.1);
      peg.position.x = 22;
      peg.position.y = 1;
      peg.userData = { render: drawPeg };
      peg = world.CreateBody(peg).CreateFixture(fixDef);

      //create the bag attached to the peg



      //setup debug draw
      device.ctx = document.getElementById('canvas').getContext('2d');

      window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

      //window.setInterval(update, 1000 / 60);
      window.requestAnimFrame(update);

      //mouse

      var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
      var canvasPosition = getElementPosition(document.getElementById("canvas"));

      document.addEventListener("mousedown", function(e) {
            mouseX = (e.clientX - canvasPosition.x) / device.drawScale;
            mouseY = (e.clientY - canvasPosition.y) / device.drawScale;
            var clickedBag = getBodyAtMouse();
            if (clickedBag) {
                  world.DestroyJoint(clickedBag.string);
            }
      }, true);


      function getBodyAtMouse() {
            mousePVec = new b2Vec2(mouseX, mouseY);
            var aabb = new b2AABB();
            aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
            aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);

            // Query the world for overlapping shapes.
            selectedBody = null;
            world.QueryAABB(getBodyCB, aabb);
            return selectedBody;
      }

      function getBodyCB(fixture) {
            if (fixture.GetBody().GetType() != b2Body.b2_staticBody) {
                  if (fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
                        selectedBody = fixture.GetBody();
                        return false;
                  }
            }
            return true;
      }

      //update
      function update() {
            window.requestAnimFrame(update);
            frame++;

            // 1. Step the world
            world.Step(1 / 25, 10, 10);
            world.ClearForces();

            // 2. Update the world
            for(var i = 0; i < level.shapes.length; i++){
                if(!level.shapes[i].flip) continue;
                if(frame % level.shapes[i].flip === 0){
                  console.log(level.shapes[i].fixture.length);
                  if(level.shapes[i].fixture.length === undefined){
                    velocity = level.shapes[i].fixture.m_body.GetLinearVelocity();
                    level.shapes[i].fixture.m_body.SetLinearVelocity(new b2Vec2(-velocity.x, -velocity.y));

                  }else{

                    for(var j = 0; j < level.shapes[i].fixture.length; j++){
                      velocity = level.shapes[i].fixture[j].m_body.GetLinearVelocity();
                      level.shapes[i].fixture[j].m_body.SetLinearVelocity(new b2Vec2(-velocity.x, -velocity.y));

                    }

                  }
                }
            }

            // 3. Render the world
          // if ( !DEBUG_FLAGS.motionBlurRender.enabled ) {
          //     device.ctx.fillStyle = 'black';
          //     device.ctx.fillRect(0, 0, device.width, device.height);
          // }
           device.ctx.clearRect(0, 0, device.width, device.height);

                       if (world.m_jointList) {
              var j = world.m_jointList;
              device.ctx.save();
              while (j) {
                device.ctx.beginPath();
                device.ctx.moveTo(j.m_bodyA.m_xf.position.x * device.drawScale, j.m_bodyA.m_xf.position.y * device.drawScale);
                device.ctx.lineTo(j.m_bodyB.m_xf.position.x * device.drawScale, j.m_bodyB.m_xf.position.y * device.drawScale);
                device.ctx.lineWidth = 4;
                device.ctx.strokeStyle = 'white';
                device.ctx.stroke();
                j = j.m_next;
              }
              device.ctx.restore();
            }

          for ( var b = world.GetBodyList(); b; b = b.m_next ) {
              if ( b.m_userData ) {
                  if (b.m_userData.render ) {
                      b.m_userData.render(b);
                  }
              }
          }



            if ( DEBUG_FLAGS.drawFrameCount ) {
                device.ctx.fillStyle = 'white';
                device.ctx.fillText(''+frame, 10, 10);
            }

            if ( DEBUG_FLAGS.motionBlurRender.enabled ) {
                device.ctx.save();
                device.ctx.fillStyle = 'rgba(0, 0, 0, ' + DEBUG_FLAGS.motionBlurRender.intensity + ')';
                device.ctx.fillRect(0, 0, 1400, 900);
                device.ctx.restore();
            }

            // 4. Process objects that have been marked for deletion
            processObjectsForDeletion();
      };

      //helpers

      //http://js-tut.aardon.de/js-tut/tutorial/position.html
      function getElementPosition(element) {
            var elem = element,
                  tagname = "",
                  x = 0,
                  y = 0;

            while ((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
                  y += elem.offsetTop;
                  x += elem.offsetLeft;
                  tagname = elem.tagName.toUpperCase();

                  if (tagname == "BODY")
                        elem = 0;

                  if (typeof(elem) == "object") {
                        if (typeof(elem.offsetParent) == "object")
                              elem = elem.offsetParent;
                  }
            }

            return {
                  x: x,
                  y: y
            };
      }

};

      function removeBodys(){
        var list = world.m_bodyList;

        while(list.m_next){
          if ( list.m_userData && list.m_userData.render != drawWall ) {
              flagForDeletion(list);
          }
          list = list.m_next;
        }
      }

  function nextLevel(){
    removeBodys();
    currentLevel++;
    if(currentLevel === levels.length) currentLevel = 0;
    level = levels[currentLevel];
    drawLevel();
  }


