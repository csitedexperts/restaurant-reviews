/*** Code taken from Micah Stubbs on bl.ocks.org and customized ***/
/*** bl.ocks.org/micahstubbs/8e15870eb432a21f0bc4d3d527b2d14f ***/

// Initialize variables
var topology   = "",
    reviews    = "",
    width      = 780,
    height     = 500,
    svg        = null,
    projection = null,
    path       = null;

/*** Wrap everything in functions because async ***/

// World map TopoJSON
topology = "https://gist.githubusercontent.com/d3noob/5189284/raw/7c4bbf3f44d2aeb4d01ca6365b7978b09fdc8766/world-110m2.json";
// Restaurant review CSV file
reviews = "https://cdn.rawgit.com/fronce14/restaurant-reviews/master/restaurant_reviews.csv";

// Set size of rendered map
// width  = config.div_width-config.margin_left-config.margin_right;
// height = config.div_height-config.margin_top-config.margin_bottom;

// Target HTML element and prepare it for rendering SVG map and markers
svg = d3.select("#reviews_location_map")
        .append("svg")
          .attr("width", width)
          .attr("height", height)
        .append('g')
          .attr("class", "reviews_location_group");

// Projections transform spherical polygonal geometry to planar polygonal geometry
projection = d3.geoMercator()
               .scale(123)
               .translate([width/2, height/2]);

// take a GeoJSON geometry/feature object and generates an SVG path data string or renders the path to a Canvas
path = d3.geoPath()
         .projection(projection);

function render(topology, reviews){
  // Load world map TopoJSON
  d3.json(topology, function render_map(topology){
    // Convert TopoJSON to GeoJSON
    var geojson = topojson.feature(topology, topology.objects.countries);

    // Render and style SVG country shapes
    svg.append("g")
         .attr("class", "reviews_map_countries")
       .selectAll("path")
       .data(geojson.features)
       .enter()
       .append("path")
         .attr("d", path)
         .style("fill", "#ddd")
         .style("stroke", "#fff")
         .style("stroke-width", "0.75px");

    // Load reviews dataset
    d3.csv(reviews, function render_review_location(reviews){

      // Variables for reuse
      var lon = "longitude",
          lat = "latitude";

      // Render and style circle location marker for each observation in reviews dataset
      svg.append("g")
      		 .attr("class", "location_markers")
      	 .selectAll("circle")
         .data(reviews)
         .enter()
         .append("circle")
           .attr("cx", function(d) { return projection([d[lon], d[lat]])[0]; })
           .attr("cy", function(d) { return projection([d[lon], d[lat]])[1]; })
           .attr("r", 2.5)
           .style("fill", "steelblue");
    });

  });
}

// Load map
render(topology, reviews)