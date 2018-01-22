/*** Code taken from Micah Stubbs on bl.ocks.org and customized ***/
/*** bl.ocks.org/micahstubbs/8e15870eb432a21f0bc4d3d527b2d14f ***/

// Config.txt file location
var config = {
	"map_location": "gist.githubusercontent.com/d3noob/5189284/raw/7c4bbf3f44d2aeb4d01ca6365b7978b09fdc8766/world-110m2.json",
	"reviews_location": "rawgit.com/fronce14/restaurant-reviews/master/restaurant_reviews.csv",
	"reviews_latitude_column": "latitude",
	"reviews_longitude_column": "longitude",
	"div_id": "reviews_location_map",
	"div_width": 780,
	"div_height": 615,
	"margin_top": 0,
	"margin_bottom": 0,
	"margin_left": 0,
	"margin_right": 0,
	"map_scale": 130,
	"map_shift_horizontal": 2,
	"map_shift_vertical": 1.5,
	"country_fill_color": "#ccc",
	"counter_border_color": "#fff",
	"country_border_width": 0.5,
	"location_marker_radius": 3,
	"location_marker_color": "steelblue"
};

// Initialize variables
var topology   = "",
    reviews    = "",
    width      = 0,
    height     = 0,
    svg        = null,
    projection = null,
    path       = null;

/*** Wrap everything in functions because async ***/

// Assign values to variables using config object
function set_vars(config){

  /*************************************************
  **DELETE "https://"+ WHEN USING LOCAL DATA FILES**
  *************************************************/
  // World map TopoJSON
  topology = "https://"+config.map_location;
  // Restaurant review CSV file
  reviews = "https://"+config.reviews_location;

  // Set size of rendered map
  width  = config.div_width-config.margin_left-config.margin_right;
  height = config.div_height-config.margin_top-config.margin_bottom;

  // Target HTML element and prepare it for rendering SVG map and markers
  svg = d3.select("#"+config.div_id)
          .append("svg")
            .attr("width", width)
            .attr("height", height)
          .append('g')
            .attr('class', 'reviews_location_map');

  // Projections transform spherical polygonal geometry to planar polygonal geometry
  projection = d3.geoMercator()
                 .scale(config.map_scale)
                 .translate([width/config.map_shift_horizontal, height/config.map_shift_vertical]);

  // take a GeoJSON geometry/feature object and generates an SVG path data string or renders the path to a Canvas
  path = d3.geoPath()
           .projection(projection);

  render(config, topology, reviews);
}

function render(config, topology, reviews){
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
         .style("fill", config.country_fill_color)
         .style("stroke", config.counter_border_color)
         .style("stroke-width", config.country_border_width+"px");

    // Load reviews dataset
    d3.csv(reviews, function render_review_location(reviews){

      // Variables for reuse
      var lon = config.reviews_longitude_column,
          lat = config.reviews_latitude_column;

      // Render and style circle location marker for each observation in reviews dataset
      svg.append("g")
      		 .attr("class", "location_markers")
      	 .selectAll("circle")
         .data(reviews)
         .enter()
         .append("circle")
           .attr("cx", function(d) { return projection([d[lon], d[lat]])[0]; })
           .attr("cy", function(d) { return projection([d[lon], d[lat]])[1]; })
           .attr("r", config.location_marker_radius)
           .style("fill", config.location_marker_color);
    });

  });
}

// Load config file and start the domino chain of functions
// d3.text(config_txt, create_config);
set_vars(config);