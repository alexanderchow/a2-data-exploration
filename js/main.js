/*
 *  A2-data-exploration
 *  Alex Chow
 *  Chlorpleth map to visualize county level US census data.
 *
 *  Can be easily modified by simply adding another variable from the data, and another domain of the given variable
 */

 
$(function() {

  // class constants for domain of each of the variables
  // can be easily modified and changed with addition of a new variable
  var DOMAIN_POP = [0, 10000, 25000, 50000, 150000, 500000, 750000, 1000000],
      DOMAIN_MHV = [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000],
      DOMAIN_MHI = [0, 25000, 35000, 45000, 55000, 65000, 75000, 85000];

  // set the value of the first color domain
  var colorDomain = DOMAIN_POP;

  console.log("hi");


  // Setting defaults
  var margin = {
          top: 40,
          right: 10,
          bottom: 10,
          left: 10
      },
      width = 960,
      height = 700,
      drawWidth = width - margin.left - margin.right,
      drawHeight = height - margin.top - margin.bottom,
      measure = 'population'; // variable to visualize

  // Append a wrapper div for the chart
  var div = d3.select('#vis')
      .append("div")
      .attr('height', height)
      .attr('width', width)
      .style("left", margin.left + "px")
      .style("top", margin.top + "px");


  var svg = div.append('svg')
      .attr('width', drawWidth)
      .attr('height', drawHeight);

  var demographics = d3.map();

  var path = d3.geoPath();

  // sets the position and domain of the scale
  var x = d3.scaleBand()
      .domain(colorDomain)
      .rangeRound([550, 850]);


  // sets the color scale based on the data
  var color = d3.scaleThreshold()
      .domain(colorDomain)
      .range(d3.schemeBlues[8]);

  var g = svg.append("g")
      .attr("class", "key")
      .attr("transform", "translate(0,40)");

  // creates a rectangle to create the scale
  g.selectAll("rect")
    .data(color.range().map(function(d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
    .enter().append("rect")
      .attr("height", 10)
      .attr("x", function(d) { return x(d[0]) + 20; })
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })
      .attr("fill", function(d) { return color(d[0]); });

  var scaleLabel = g.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(measure);


  // reads the csv file and calls the 'ready' function
  d3.queue()
      .defer(d3.json, "https://d3js.org/us-10m.v1.json")
      .defer(d3.csv, "data/acs_data.csv", function(d) { demographics.set(d.id2, +d[measure]); })
      .await(ready);



  // draws the chloropleth map
  function ready(error, us) {
    if (error) throw error;

    g.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(function(x, i) { return i ? x / 1000 + "K" : x; }))
      //.tickValues(color.domain()))
      .select(".domain")
      .remove();

    // draws the county objects
    svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
      .enter().append("path")
        .attr("fill", function(d) { return color(d[measure] = demographics.get(d.id)); })
        .attr("d", path)
        // hover commands
        .on("mouseover", function() {
            d3.select(this).style("fill", "red");
        })
        .on("mouseout", function() {
            d3.select(this).style("fill", function(d) { return color(d[measure] = demographics.get(d.id)); });
        })
      .append("title")
        .text(function(d) { return measure + ":  " + d[measure];})


    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);
  }



  // function for calling the draw function
  function setColorDomain(value) {
    if (value == 'population') {
      colorDomain = DOMAIN_POP;
    } else if (value == 'mhv') {
      colorDomain = DOMAIN_MHV;
    } else {
      colorDomain = DOMAIN_MHI;
    }
    console.log(colorDomain);
  }


  // if the variable is changed, redraw the map
  $("input").on('change', function() {
      // Set your measure variable to the value (which is used in the draw funciton)
      measure = $(this).val();
      setColorDomain(measure);
      x.domain(colorDomain);
      color.domain(colorDomain);
      scaleLabel.text(measure);


      // Draw your elements
      d3.queue()
        .defer(d3.json, "https://d3js.org/us-10m.v1.json")
        .defer(d3.csv, "data/acs_data.csv", function(d) { demographics.set(d.id2, +d[measure]); })
        .await(ready);        
      
  });

  
});

