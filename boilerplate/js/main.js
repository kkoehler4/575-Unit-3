//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap() {
    //use Promise.all to parallelize asynchronous data loading

     //map frame dimensions
     var width = 600,
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

        //variables for data join
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];
/*
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<School_Districts.csv.length; i++){
        var csvRegion = School_Disctricts.csv[i]; //the current region
        var csvKey = csvRegion.SUPERNAME; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<franceRegions.length; a++){

            var geojsonProps = franceRegions[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.what; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
*/
        //add Vermont school districts to map
        var vermontDistricts = map.selectAll(".vermontDistricts")
            .data(schoolDistrictsNew)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "vermontDistricts";
            })
            .attr("d", path);

        //examine the results
        console.log(schoolDistrictsNew);
}
}
