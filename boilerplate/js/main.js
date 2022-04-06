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
    .center([26.45, 38.15])
    .rotate([100.8, -7, 0])
    .parallels([0.00, 37.95])
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
