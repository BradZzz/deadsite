angular.module('ambrosia').directive('seHex', ['$rootScope', '$window', 'seTemplate', 'seStatic', function ($rootScope, $window, seTemplate, seStatic) {
  return {
    restrict: 'E',
    scope: {
        show: '=',
    },
    link: function (scope, element, attrs) {
        if (seTemplate.getRootMap(seTemplate.getTemplateMap()).hex) {
            var size = 0

            function returnSize () {
                return $window.innerWidth > 1300 ? 0 : $window.innerWidth > 1085 ? 1 : $window.innerWidth > 760 ? 2 : 3;
            }

            angular.element($window).bind('resize', function (e) {
              console.log('resize', e, this)
              console.log('dims', $window.innerWidth, $window.innerHeight)
              if (returnSize() !== size) {
                size = returnSize()
                render()
              }
            })

            function returnDimensions (size) {
                return size === 0 ? { width : 1000, height : 550, radius : 50, innerWidth : 1100 } :
                    size === 1 ? { width : 800, height : 750, radius : 50, innerWidth : 900 } :
                    size === 2 ? { width : 600, height : 950, radius : 50, innerWidth : 700 } :
                    { width : 300, height : 1250, radius : 50, innerWidth : 400 }
            }

            var render = function(){
                $rootScope.showHexGrid = true

                console.log($window)

                var dims = returnDimensions(returnSize())

                console.log(dims)

                var width = dims.width,
                    height = dims.height,
                    radius = dims.radius;

                var topology = hexTopology(radius, width, height);

                var projection = hexProjection(radius);

                var path = d3.geo.path()
                    .projection(projection);

                $('.hex-container').empty()

                var svg = d3.select(".hex-container").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("style","padding-top: 80px; width : " + dims.innerWidth + "px !important;")
                    .attr("class","selectable hex-child");

                var defs = svg.append("defs")

                _.each(seStatic.getStaticStates(), function (state) {
                    defs.append("pattern").attr("id",state.title).attr("patternUnits","objectBoundingBox").attr("width",1).attr("height",1)
                      .append("image").attr("preserveAspectRatio","none").attr("xlink:href",state.pic)
                      .attr("x",-10).attr("y",0).attr("width",120).attr("height",100)
                })

                svg.append("g")
                    .attr("class", "hexagon")
                  .selectAll("path")
                    .data(topology.objects.hexagons.geometries)
                  .enter().append("path")
                    .attr("d", function(d) { return path(topojson.feature(topology, d)); })
                    .attr("id", function(d) { return d.id })
                    .attr("fill", function(d) { return d.fill })
                    .on("mousedown", mousedown)
                    .on("mousemove", mousemove)
                    .on("mouseup", mouseup);

                svg.append("path")
                    .datum(topojson.mesh(topology, topology.objects.hexagons))
                    .attr("class", "mesh")
                    .attr("d", path);

                var border = svg.append("path")
                    .attr("class", "border")
                    .call(redraw);

                var mousing = 0;

                function mousedown(d) {
                  if (d.fill) {
                      var id = d.fill.substring(5, d.fill.length - 1)
                      var link = _.find(seStatic.getStaticStates(), function(state){
                        return state.title === id
                      })
                      console.log(link)
                      $window.open(link.link)
                  }
                  //mousing = d.fill ? -1 : +1;
                  mousemove.apply(this, arguments);
                }

                function mousemove(d) {
                  if (mousing) {
                    d3.select(this).classed("fill", d.fill = mousing > 0);
                    border.call(redraw);
                  }
                }

                function mouseup() {
                  mousemove.apply(this, arguments);
                  mousing = 0;
                }

                function redraw(border) {
                  border.attr("d", path(topojson.mesh(topology, topology.objects.hexagons, function(a, b) { return a.fill ^ b.fill; })));
                }

                function hexTopology(radius, width, height) {
                  var states = JSON.parse(JSON.stringify(seStatic.getStaticStates()))
                  var dx = radius * 2 * Math.sin(Math.PI / 3),
                      dy = radius * 2,
                      m = Math.ceil((height + radius) / dy) + 1,
                      n = Math.ceil(width / dx),
                      geometries = [],
                      arcs = [];

                  for (var j = -1; j <= m; ++j) {
                    for (var i = -1; i <= n; ++i) {
                      var y = j * 2, x = (i + (j & 1) / 2) * 2;
                      arcs.push([[x, y - 1], [1, 1]], [[x + 1, y], [0, 1]], [[x + 1, y + 1], [-1, 1]]);
                    }
                  }

                  for (var j = 0, q = 3; j < m; ++j, q += 6) {
                    for (var i = 0; i < n; ++i, q += 3) {
                      if (i > 0 && j > 1) {

                        var state = states.shift()

                        if (state !== undefined) {
                            geometries.push({
                              type: "Polygon",
                              arcs: [[q, q + 1, q + 2, ~(q + (n + 2 - (j & 1)) * 3), ~(q - 2), ~(q - (n + 2 + (j & 1)) * 3 + 2)]],
                              fill: "url(#" + state.title + ")"
                              //fill: Math.random() > i / n * 2
                            })
                        }
                      }
                    }
                  }

                  return {
                    transform: {translate: [0, 0], scale: [1, 1]},
                    objects: {hexagons: {type: "GeometryCollection", geometries: geometries}},
                    arcs: arcs
                  };
                }

                function hexProjection(radius) {
                  var dx = radius * 2 * Math.sin(Math.PI / 3),
                      dy = radius * 1.5;
                  return {
                    stream: function(stream) {
                      return {
                        point: function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
                        lineStart: function() { stream.lineStart(); },
                        lineEnd: function() { stream.lineEnd(); },
                        polygonStart: function() { stream.polygonStart(); },
                        polygonEnd: function() { stream.polygonEnd(); }
                      }
                    }
                  }
                }
            }
            render()
        }
    }
  }
}])
