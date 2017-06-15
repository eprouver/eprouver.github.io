'use strict';

/**
 * @ngdoc service
 * @name frontsApp.startTerritory
 * @description
 * # startTerritory
 * Factory in the frontsApp.
 */
angular.module('frontsApp')
  .factory('startTerritory', function() {
    return function(width, height){
    var vertices = [];

    var voronoi = d3.geom.voronoi()
      .clipExtent([
        [0, 0],
        [width, height]
      ]);

    var svg = d3.select("#territory")
      .attr("viewBox", "0 0 " + width + ' ' + height);

    var path = svg.append("g").selectAll("path");

    function polygon(d) {
      return "M" + d.join("L") + "Z";
    }

    function redraw(x, y, team) {
      // $('.remove-me').remove();
      // $("#territory").addClass('aniated fadeIn').clone().removeClass('fadeIn').addClass('remove-me animated fadeOut').insertAfter('#territory');

      var borders = [];

      path = path
        .data(voronoi(vertices.map(function(v) {
          return v.loc;
        })), polygon);

      path.exit().remove();
      path.enter().append("path")
        .attr('fill', function(d, i) {
          return vertices[i].fill;
        })
        .attr('stroke', function(d, i) {
          return vertices[i].fill;
        })
        .attr("d", polygon)
        .each(function(d, i){
          d.team = vertices[i];
          borders.push(d);
        })

      var sharedPath = [];

      _.chain(borders).map(function(b){
        for(var i = 0; i < b.length; i++){
          b[i][0] = ~~b[i][0];
          b[i][1] = ~~b[i][1];
        }

        return b;
      })
      .forEach(function(b, i, arr){
        var others = arr.filter(function(t){ return t.team.team !== b.team.team; });
        var now, next, path;

        //check all the path segements
        for(var i = 0; i < b.length -1; i++){
          now = b[i].join(',');
          next = b[i+1].join(',');

          for(var o = 0; o < others.length; o++){
            path = _.flatten(others[o]).join(',');
            if(path.indexOf(now) > -1 && path.indexOf(next) > -1){
              sharedPath.push([b[i], b[i+1]])
            }
          }
        }
        //Check the closing path segment
        for(var o = 0; o < others.length; o++){
            path = _.flatten(others[o]).join(',');
            now = b[b.length -1].join(',');
            next = b[0].join(',');
            if(path.indexOf(now) > -1 && path.indexOf(next) > -1){
              sharedPath.push([b[b.length -1], b[0]])
            }
          }
      })

      var lineGenerator = d3.svg.line();
      svg.select('.o-path').remove();
      var oPath = svg.append("g")
        .attr('class', 'o-path');

      sharedPath.forEach(function(d){
        oPath.append('path')
        .attr('d', lineGenerator(d));
      })

      path.order();
    }

    function inside(x, y, vs) {
      // ray-casting algorithm based on
      // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

      var inside = false;
      for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
          yi = vs[i][1];
        var xj = vs[j][0],
          yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }

      return inside;
    };

    return {
      redraw: redraw,
      vertices: vertices,
      setVerts: function(verts) {
        vertices = verts;
      },
      findTerritory: function(x, y) {
        var verts = voronoi(vertices.map(function(v) {
          return v.loc
        }));
        for (var i = 0; i < vertices.length; i++) {
          //check to see if point is inside this territory
          if (inside(x, y, verts[i])) {
            return vertices[i].team;
          }
        }
      }
    }
  }});
