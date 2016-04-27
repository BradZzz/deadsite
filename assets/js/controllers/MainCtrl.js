String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

angular.module('ambrosia').controller('MainCtrl',
['$scope', '$rootScope', '$q', '$sce', '$window', 'seTemplate',
 function ($scope, $rootScope, $q, $sce, $window, seTemplate)
{
    $rootScope.loading = true
    $rootScope.loading = false

    var template = seTemplate.getTemplateMap()
    template = (template === undefined ? 'default' : template)
    var title = template.replace(/-/g,' ').capitalize() + '.com'
    template = '/assets/html/partials/' + template + '.html'

    console.log(template)

    $scope.ctrl = {
        countdown : moment('08/12/2016').tz("America/Los_Angeles").endOf('day').format(),
        walls : ['alt1', 'alt2', 'alt3', 'alt4', 'alt5'],
        position : 2,
        logoClick : function () {
            this.position += 1
            if (this.position > this.walls.length - 1) {
                this.position = 0
            }
        },
        title : title,
        template : template,
    }

    console.log($scope.ctrl.template)

    $scope.render = function(){

        $rootScope.showHexGrid = true

        console.log('here')

        console.log($(".hex-container").height(), $(".hex-container").width())
        console.log($(".hex-container").innerHeight(), $(".hex-container").innerWidth())

        var hex = $(".hex-container")[0]

        console.log($window)

        var width = $window.innerWidth - 300,
            height = $(".hex-container").height(),
            radius = 50;

        var topology = hexTopology(radius, width, height);

        var projection = hexProjection(radius);

        var path = d3.geo.path()
            .projection(projection);

        var svg = d3.select(".hex-container").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("style", "width:100%; margin-left:100px;");

        var defs = svg.append("defs").append("pattern").attr("id","img1").attr("patternUnits","objectBoundingBox").attr("width",1).attr("height",1)
            .append("image").attr("preserveAspectRatio","none").attr("xlink:href","https://farm3.staticflickr.com/2878/10944255073_973d2cd25c.jpg")
                .attr("x",-10).attr("y",0).attr("width",120).attr("height",100)

        console.log(svg)

        svg.append("g")
            .attr("class", "hexagon")
          .selectAll("path")
            .data(topology.objects.hexagons.geometries)
          .enter().append("path")
            .attr("d", function(d) { return path(topojson.feature(topology, d)); })
            //.attr("class", function(d) { return d.fill ? "fill" : null; })
            .attr("fill", function(d) { return d.fill })
            .on("mousedown", mousedown)
            .on("mousemove", mousemove)
            .on("mouseup", mouseup);

        svg.append("path")
            .datum(topojson.mesh(topology, topology.objects.hexagons))
            .attr("class", "mesh")
            .attr("d", path);

        console.log(svg)

        var border = svg.append("path")
            .attr("class", "border")
            .call(redraw);

        var mousing = 0;

        function mousedown(d) {
          mousing = d.fill ? -1 : +1;
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
              if (i > 0) {
                  geometries.push({
                    type: "Polygon",
                    arcs: [[q, q + 1, q + 2, ~(q + (n + 2 - (j & 1)) * 3), ~(q - 2), ~(q - (n + 2 + (j & 1)) * 3 + 2)]],
                    fill: "url(#img1)"
                    //fill: Math.random() > i / n * 2
                  });
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
              };
            }
          };
        }
    }

    $scope.render()

}])