//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["boys", "girls", "lunch_eligible", "not_lunch_eligible", "public_prek", "not_public_prek"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    
    //begin script when window loads
    window.onload = setMap();

    //Example 1.3 line 4...set up choropleth map
    function setMap() {
        //use Promise.all to parallelize asynchronous data loading

	    //map frame dimensions
    	var width = window.innerWidth * 0.5,
        height = 800;

        //create new svg container for the map
        var map = d3.select("body")
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
        // d3.json("data/states.topojson")
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

    function makeColorScale(data){
		var colorClasses = [
	        "#f6eff7",
	        "#bdc9e1",
	        "#67a9cf",
	        "#1c9099",
	        ""
	    ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
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
                    return "vermontDistricts";
                })
                .attr("d", path)
                .style("fill", function(d){
                    var value = d.properties[expressed];            
                     if(value) {                
                         return colorScale(d.properties[expressed]);            
                     } else {                
                         return "#ccc";            
                     }    
               });

            //examine the results
            console.log(schoolDistrictsNew);
    
    }

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 600,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
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

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([600, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
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
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Percent " + expressed[3] + " 'Ready For Kindergarten'");

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
};

})();