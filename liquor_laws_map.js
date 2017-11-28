// Code by Patty Alice Jiang
// https://www.github.com/becausealice2/FA-viz/liquor_laws/tree/master/liquor_laws


// Polyfill for EventTarget.addEventListener()
(function() {
  if (!Event.prototype.preventDefault) {
    Event.prototype.preventDefault=function() {
      this.returnValue=false;
    };
  }
  if (!Event.prototype.stopPropagation) {
    Event.prototype.stopPropagation=function() {
      this.cancelBubble=true;
    };
  }
  if (!Element.prototype.addEventListener) {
    var eventListeners=[];
    
    var addEventListener=function(type,listener /*, useCapture (will be ignored) */) {
      var self=this;
      var wrapper=function(e) {
        e.target=e.srcElement;
        e.currentTarget=self;
        if (typeof listener.handleEvent != 'undefined') {
          listener.handleEvent(e);
        } else {
          listener.call(self,e);
        }
      };
      if (type=="DOMContentLoaded") {
        var wrapper2=function(e) {
          if (document.readyState=="complete") {
            wrapper(e);
          }
        };
        document.attachEvent("onreadystatechange",wrapper2);
        eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper2});
        
        if (document.readyState=="complete") {
          var e=new Event();
          e.srcElement=window;
          wrapper2(e);
        }
      } else {
        this.attachEvent("on"+type,wrapper);
        eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper});
      }
    };
    var removeEventListener=function(type,listener /*, useCapture (will be ignored) */) {
      var counter=0;
      while (counter<eventListeners.length) {
        var eventListener=eventListeners[counter];
        if (eventListener.object==this && eventListener.type==type && eventListener.listener==listener) {
          if (type=="DOMContentLoaded") {
            this.detachEvent("onreadystatechange",eventListener.wrapper);
          } else {
            this.detachEvent("on"+type,eventListener.wrapper);
          }
          eventListeners.splice(counter, 1);
          break;
        }
        ++counter;
      }
    };
    Element.prototype.addEventListener=addEventListener;
    Element.prototype.removeEventListener=removeEventListener;
    if (HTMLDocument) {
      HTMLDocument.prototype.addEventListener=addEventListener;
      HTMLDocument.prototype.removeEventListener=removeEventListener;
    }
    if (Window) {
      Window.prototype.addEventListener=addEventListener;
      Window.prototype.removeEventListener=removeEventListener;
    }
  }
})(); // End EventTarget.addEventListener() polyfill


// Initialize variables
var config     = {},
    topology   = "",
    reviews    = "",
    width      = 0,
    height     = 0,
    svg        = null,
    projection = null,
    path       = null;

/*** Wrap everything in functions because async ***/

// Convert input from config.txt file to JSON and apply to config object
function create_config(file){
  var lines = file.toString().split("\n");
  lines.forEach(function config_json(line){
  	if (line != "") {
	    line = line.split(":")
	    var key   = line[0].trim().toLowerCase();
	    var value = line[1].trim();
	  
	    config[key] = value;
		} // Close if (line != "") {...
  }); // Close lines.forEach(function config_json(line){...

  redraw(config);
} //close function create_config(file){...

function redraw(config){
	// Load world map topojson
	d3.json("https://"+config.map_location, function render_map(topology){
		
		// Use world map's bounding box array to calculate the map's aspect ratio
		var geo_objects      = topology.objects.countries,
	      bbox             = geo_objects.bbox,
	      map_aspect_ratio = (bbox[2]-bbox[0]) / (bbox[3]-bbox[1]);

		// Get target element's width and use aspect ratio to set height
		var width   = document.getElementById(config.div_id).clientWidth,
	      height  = width / map_aspect_ratio,
	  		// Set margins around rendered map
	  		margins = {
			  				   "top": parseFloat(config.margin_top),
			  				   "bottom": parseFloat(config.margin_bottom),
			  				   "left": parseFloat(config.margin_left),
			  				   "right": parseFloat(config.margin_right)
			  				  };

		// Select target element and attach <svg> and <g> elements
		var svg = d3.select("#"+config.div_id)
	            	.append("svg")
	            		// Set SVG element's top left corner and width/height attributes
	              	.attr("viewBox",margins.top+" "+margins.left+" "+(width-margins.right)+" "+(height-margins.bottom))
	              	// Supposed to make map responsive. Works sometimes.
	              	.attr("preserveAspectRatio", "xMidYMid meet")
	              	// Group together map paths and location markers	
	            	.append('g')
	                .attr('class', config.div_id);

		// Projections transform spherical polygonal geometry to planar polygonal geometry
		var projection = d3.geoMercator()
										   // Scale map
										   .scale(config.map_scale)
				               // Center the map's center point
				               .translate([(width / config.map_shift_horizontal), (height / config.map_shift_vertical)]);

		// Geo-paths take a GeoJSON geometry/feature object and generate an SVG path data string or render the path to a Canvas
		var path = d3.geoPath()
	        	     .projection(projection);

		// Convert TopoJSON file to GeoJSON for rendering
		var topology = topojson.feature(topology, geo_objects);

		// Load reviews dataset
	    d3.csv("https://"+config.reviews_location, function render_location_markers(reviews){

			// Group together country shape paths and enter data
		    svg.append("g")
		         .attr("class", config.div_id+"_countries")
		       .selectAll("path")
		       .data(topology.features)
		       .enter()
		       // Render and style map
		       .append("path")
		         .attr("d", path)
		         .style("fill", config.country_fill_color)
		         .style("stroke", config.country_border_color)
		         .style("stroke-width", config.country_border_width);
			
			// Variables for reuse
	    	var lon = config.reviews_longitude_column,
	        	lat = config.reviews_latitude_column;

			// Render and style circle location marker for each observation in reviews dataset
			svg.selectAll("circle")
			   .data(reviews)
			   .enter()
			   .append("circle")
			     .attr("cx", function(d) { return projection([d[lon], d[lat]])[0]; })
			     .attr("cy", function(d) { return projection([d[lon], d[lat]])[1]; })
			     .attr("r", parseFloat(config.location_marker_radius))
			     .style("fill", config.location_marker_color);

	    }); // Close d3.csv(reviews_url, function render_location_markers(reviews){...

	}); // Close d3.json(map_url, function render_map(topology){...
} // Close function redraw(config){...


// Load config.txt and get the ball rolling
d3.text("https://cdn.rawgit.com/becausealice2/FA-viz/master/liquor_laws/config.txt", create_config);