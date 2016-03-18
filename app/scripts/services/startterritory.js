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
      path = path
        .data(voronoi(vertices.map(function(v) {
          return v.loc;
        })), polygon);

      path.exit().remove();
      path.enter().append("path")
        .attr("class", function(d, i) {
          return "q" + (i % 9) + "-9";
        })
        .attr('fill', function(d, i) {
          return vertices[i].fill;
        })
        .attr("d", polygon);

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
