//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = [ "boys", "girls", "students eligible for free or reduced lunch", "students not eligible for free or reduced lunch", "students who attended public prek", "students who did not attend public prek"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
        chartHeight = 600,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([600, 0])
        .domain([0, 110]);
    
    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap() {
        
	    //map frame dimensions
    	var width = window.innerWidth * 0.5,
        height = 800;

        //create new svg container for the map
        var map = d3.select(".visualization")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);


        //create Albers equal area conic projection centered on Vermont
        var projection = d3.geoAlbers()
        .center([0, 38.15])
        .rotate([71.7, -6.4, 0])
        .parallels([30, 38.95])
        .scale(16000.00);
        //.translate(width / 2, height / 2);

        var path = d3.geoPath().projection(projection);

        var promises = [
            d3.csv("data/School_Districts.csv"),
            d3.json("data/schooldistricts.topojson")
        ]

        Promise.all(promises).then(callback);


        function callback(data) {
            var csvData = data[0],
                districts = data[1];
        
            //translate schooldistricts TopoJSON
            var schoolDistrictsNew  = topojson.feature(districts, districts.objects.School_Districts_New).features;

            schoolDistrictsNew = joinData(schoolDistrictsNew, csvData);

            //create the color scale
            var colorScale = makeColorScale(csvData);

	        setEnumerationUnits(schoolDistrictsNew,map,path,colorScale);

            //add coordinated visualization to the map
        	setChart(csvData, colorScale);

            //add dropdown
            createDropdown(csvData);
        };
    
    };
            
        function joinData(schoolDistrictsNew,csvData){
            //loop through csv to assign each set of csv attribute values to geojson region
             for (var i=0; i<csvData.length; i++){
                var  csvDistrict = csvData[i]; //the current district
                var csvKey = csvDistrict.SUPERNAME; //the CSV primary key
        
                console.log(csvDistrict)
                console.log(csvData)

                //loop through geojson districts to find correct district
                for (var a=0; a<schoolDistrictsNew.length; a++){

                    var geojsonProps = schoolDistrictsNew[a].properties; //the current region geojson properties
                    var geojsonKey = geojsonProps.SUPERNAME; //the geojson primary key

                    //where primary keys match, transfer csv data to geojson properties object
                    if (geojsonKey == csvKey){

                        //assign all attributes and values
                        attrArray.forEach(function(attr){
                            var val = parseFloat(csvDistrict[attr]); //get csv attribute value
                            geojsonProps[attr] = val; //assign attribute and value to geojson properties
                        
                        });
                    };
                };
            };
            return schoolDistrictsNew;
    }

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#f6eff7",
        "#bdc9e1",
        "#67a9cf",
        "#1c9099",
        "#016c59"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
 
    function setEnumerationUnits(schoolDistrictsNew,map,path,colorScale){
            //add Vermont school districts to map
            var vermontDistricts = map.selectAll(".vermontDistricts")
                .data(schoolDistrictsNew)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "vermontDistricts " + d.properties.SUPERNAME;
                })
                .attr("d", path)
                .style("fill", function(d){
                    var value = d.properties[expressed];            
                     if(value) {                
                         return colorScale(d.properties[expressed]);            
                     } else {                
                         return "#ccc";            
                     } 
                 })   
                 .on("mouseover", function(event, d){
                    highlight(d.properties);
                })
                .on("mouseout", function (event, d) {
                    dehighlight(d.properties);
                    d3.select(".infolabel").remove()
                }) 
                .on("mousemove", moveLabel);
                                 
        //below Example 2.2 line 16...add style descriptor to each path
        var desc = vermontDistricts.append("desc")
        .text('{"stroke": "grey", "stroke-width": "0.5px"}');
    }

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){

        //create a second svg element to hold the bar chart
        var chart = d3.select(".visualization")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bars for each district
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bar " + d.SUPERNAME;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d, i){
                return 600 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return colorScale(d[expressed]);
            })
            .on("mouseover", function(event, d){
                highlight(d);
            })
            .on("mouseout", function (event, d) {
                dehighlight(d);
            })
            .on("mousemove", moveLabel);  

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")

        //set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale);
        
        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        var desc = bars.append("desc").text('{"stroke": "none", "stroke-width": "0px"}');
    };

        //function to create a dropdown menu for attribute selection
        function createDropdown(csvData) {
            //add select element
            var dropdown = d3
                .select(".visualization")
                .append("select")
                .attr("class", "dropdown")
                .on("change", function () {
                    changeAttribute(this.value, csvData);
                });

            //add initial option
            var titleOption = dropdown
                .append("option")
                .attr("class", "titleOption")
                .attr("disabled", "true")
                .text("Select Attribute");

            //add attribute name options
            var attrOptions = dropdown
                .selectAll("attrOptions")
                .data(attrArray)
                .enter()
                .append("option")
                .attr("value", function (d) {
                    return d;
                })
                .text(function (d) {
                    return d.replaceAll("_", " ");
                });
        }

        //dropdown change listener handler
        function changeAttribute(attribute, csvData) {
            //change the expressed attribute
            expressed = attribute;

            //recreate the color scale
            var colorScale = makeColorScale(csvData);
        

            //recolor enumeration units
            var vermontDistricts = d3
                .selectAll(".vermontDistricts")
                .transition()
                .duration(1000)
                .style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
            
            //re-sort, resize, and recolor bars
            var bars = d3
            .selectAll(".bar")
            //re-sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function(d, i){
                return i * 20
            })
            .duration(500);

        updateChart(bars, csvData.length, colorScale);
    }

    function updateChart(bars, n, colorScale) {
        //position bars
        bars.attr("x", function (d, i) {
            return i * (chartInnerWidth / n) + leftPadding;
        })
            //size/resize bars
            .attr("height", function (d, i) {
                return 600 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i) {
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function (d) {
                var value = d[expressed];
                if (value) {
                    return colorScale(value);
                } else {
                    return "#ccc";
                }
            });

        //at the bottom of updateChart()...add text to chart title
        var chartTitle = d3
            .select(".chartTitle")
            .text("% of " + expressed + " 'R4K'");
            
        }

        //function to highlight enumeration units and bars
        function highlight(props) {
            //change stroke
            var selected = d3
                .selectAll("." + props.SUPERNAME)
                .style("stroke", "#383637")
                .style("stroke-width", "1.5");
            setLabel(props);
        }

        //function to reset the element style on mouseout
        function dehighlight(props) {
            var selected = d3
                .selectAll("." + props.SUPERNAME)
                .style("stroke", function () {
                    return getStyle(this, "stroke");
                })
                .style("stroke-width", function () {
                    return getStyle(this, "stroke-width");
                });

            function getStyle(element, styleName) {
                var styleText = d3.select(element).select("desc").text();

                var styleObject = JSON.parse(styleText);

                return styleObject[styleName];
            }
                //remove info label
                d3.select(".infolabel").remove();
        }

        //function to create dynamic label
        function setLabel(props){
        //label content
        var labelAttribute =  "<h3>" + props.SUPERNAME.replaceAll("_"," ") + "</h3>" + "<h1>" + props[expressed] +  " %" + "<br>" +
            "</h1><b>" + "</b>";

        //create info label div
        var infolabel = d3.select(".visualization")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.SUPERNAME + "_label")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.name);
    }; 

    //function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY + 200,
            x2 = event.clientX - labelWidth + 10,
            y2 = event.clientY + 50;

            console.log(y1)

        //horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1; 

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

})();


