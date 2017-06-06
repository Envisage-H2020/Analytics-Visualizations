function calculatePlaythroughOrder(d, events){
	//generate a string of characters to represent each playthrough_id
	var curr_playthrough_id = d[0].id;
	//how long we want each string to be. 
	//longer strings take more time to compute!
	//shorter strings might end up missing some values.
	//the strings will ultimately be less than or equal to this number - not all the same length!
	var string_length = 100; 
	var curr_string = "";
	var playthroughStrings = new Array();
	var i = 0;
    for (var i = 0; i < d.length; i++) {   
    	//check if we're dealing with a new playthrough
    	//we have a new playthrough! Save old data to end of array.
    	if (d[i].id != curr_playthrough_id){	   		
    		//save current string
    		playthroughStrings.push({id: curr_playthrough_id, eventString: curr_string, order: curr_string.length}); 
    		
    		var l = playthroughStrings.length -1; 
    		playthroughStrings[l].order = levenshtein(playthroughStrings[0].eventString, playthroughStrings[l].eventString);
    		curr_playthrough_id = d[i].id;		
    		curr_string = ""; //reset current string
    		
    		//set all d orders retroactively
    		var j = i-1;
    		while ((j >= 0) && (d[j].id == d[i-1].id)){
    			d[j].order = playthroughStrings[l].order;
    			j--;
    		}
    	}
    	var sessionLength = d[i].times.session_ending_time - d[i].times.session_starting_time;
		var eventLength =  d[i].times.ending_time - d[i].times.starting_time;
		var numberOfCharacters = Math.floor(string_length*(eventLength/sessionLength));
		if (numberOfCharacters > 1.0){
			var eventChar = getChar(d[i].event , events);
			for (var f = 0; f < numberOfCharacters; f++){
				curr_string += eventChar;
			} 
		}
    }
    
    //save final old data to end of playthroughStrings array
    playthroughStrings.push({id: curr_playthrough_id, eventString: curr_string, order: 0});
    var l = playthroughStrings.length -1; 
    playthroughStrings[l].order = levenshtein(playthroughStrings[0].eventString, playthroughStrings[l].eventString); 
    
    var j = d.length -1;
	while ((j >= 0) && (d[j].id == d[d.length -1].id)){
		d[j].order = playthroughStrings[l].order;
		j--;
	}
    
    //sort playthroughStrings by order
    d.sort(function(a, b) {
		return b.order - a.order;
	});	
}

function convertLinksToDataStructure(data){
    //Convert links to a timeline data structure
	//we want an array of the following: 
	//event: "", times:[{"starting_time":num, "ending_time":num}]
	
	//we assume that the data is ordered by user and chronologically
	
	var graph = new Array();
	var playthrough_id;
	var session_starting_time;
	var session_ending_time;
	
	//BUG
	//We do NOT currently know the true ending time for events
	//Sessions currently end when the last event BEGINS
	//Temp solution - give all final events an ending time - all of the same length of time
	//use THAT ending time as the new ending time for the entire session
	
	for (var i = 0; i < data.length; i++) { 	               
		if ((category == "all") || (category.toLowerCase() == data[i].locale.toLowerCase()	)) {
			if ((+data[i].ts < +timeLimits[1]) && (+data[i].ts > +timeLimits[0])){
			//assumes that the first event in the log of playtraces is a Launch event
				if ((i > 0) && (data[i-1].user_id == data[i].user_id )){
					if (data[i].event != "launch"){
						//starting from second event, calculate the start and end times of preceding event								
						//IMPORTANT: Ignores final event! We don't know the duration of this.
						if (data[i-1].event == "launch"){
							playthrough_id++; //treat every 'launch' event as the start of a new game
							session_starting_time = timeConverter(data[i-1].ts);
						}	
						var id = data[i-1].user_id + ", game "+playthrough_id;
						var event = data[i-1].event;
						var starting_time = timeConverter(+data[i-1].ts);
						var ending_time = timeConverter(+data[i].ts);
							
						var times = {starting_time, ending_time, session_starting_time, session_ending_time};
						graph.push({
							id: id,
							event: event,
							times: times,
							order: 0
						});
					}
					else {
						//current event is Launch, start new session
						session_starting_time = timeConverter(data[i].ts);
					}
				}
				else {
					playthrough_id = 0; //reset current player's game
					session_starting_time = timeConverter(data[i].ts); //mark the time when player starts a playthrough
				}			
			}
		}
	}
	//we want an array of the following: 
	//event: "", times:[{"starting_time":num, "ending_time":num}]
	
	//we assume that the data is ordered by user and chronologically
	
	var graph = new Array();
	var playthrough_id;
	var session_starting_time;
	var session_ending_time;
	
	//BUG
	//We do NOT currently know the true ending time for events
	//Sessions currently end when the last event BEGINS
	//It is expected future version of the game will include this missing data.
	
	for (var i = 0; i < data.length; i++) { 	               
		if ((category == "all") || (category.toLowerCase() == data[i].locale.toLowerCase()	)) {
			if ((+data[i].ts < +timeLimits[1]) && (+data[i].ts > +timeLimits[0])){
			//assumes that the first event in the log of playtraces is a Launch event
				if ((i > 0) && (data[i-1].user_id == data[i].user_id )){
					if (data[i].event != "launch"){
						//starting from second event, calculate the start and end times of preceding event								
						//IMPORTANT: Ignores final event! We don't know the duration of this.
						if (data[i-1].event == "launch"){
							playthrough_id++; //treat every 'launch' event as the start of a new game
							session_starting_time = timeConverter(data[i-1].ts);
						}	
						var id = data[i-1].user_id + ", game "+playthrough_id;
						var event = data[i-1].event;
						var starting_time = timeConverter(+data[i-1].ts);
						var ending_time = timeConverter(+data[i].ts);
							
						var times = {starting_time, ending_time, session_starting_time, session_ending_time};
						graph.push({
							id: id,
							event: event,
							times: times,
							order: 0
						});
					}
					else {
						//current event is Launch, start new session
						session_starting_time = timeConverter(data[i].ts);
					}
				}
				else {
					playthrough_id = 0; //reset current player's game
					session_starting_time = timeConverter(data[i].ts); //mark the time when player starts a playthrough
				}			
			}
		}
	}
	
	//update session ending variables
	for (var i = graph.length - 1; i >= 0; i--){ 
		if (i == (graph.length - 1) ){
			//safely assume that a session has ended!
			graph[i].times.session_ending_time == graph[i].times.ending_time;
		}
		else if (graph[i].times.session_starting_time == graph[i+1].times.session_starting_time){
			//if two events have the same session start time, they must have the same session end time
			//that's how sessions work					
			graph[i].times.session_ending_time = graph[i+1].times.session_ending_time;
		}
		else {
			graph[i].times.session_ending_time = graph[i].times.ending_time;
		}
	}
	return graph;
}

function convertToJson(text){ //format data to match JSON pattern, then convert it
	text = text.substring(0, text.length - 1);     //remove final comma            
    text = "[" + text.replace(/(?:\r\n|\r|\n)/g, ',\n') + "]"; //convert to full JSON format
	return JSON.parse(text);
}

//identify each event type by a unique string
//given that there are less unique events than letters in the alphabet,
//convert array id of each to letter
function getChar(event, events){
	index = -1; 
	//find event in list of events, determine ID
	//should always return an event, never -1
	events.forEach(function(d, j) {
	if (d.event == event){
		index = j;
	}});
	return String.fromCharCode(97 + index);
}

function getPlaythroughOrder(id, order){
	order.forEach(function(d) {
		if (d.id == id){
			return d.order;
		}});
	return -1;
}

//ref:http://stackoverflow.com/questions/18516942/fastest-general-purpose-levenshtein-javascript-implementation
function levenshtein(s, t) {
    if (s === t) {
        return 0;
    }
    var n = s.length, m = t.length;
    if (n === 0 || m === 0) {
        return n + m;
    }
    var x = 0, y, a, b, c, d, g, h, k;
    var p = new Array(n);
    for (y = 0; y < n;) {
        p[y] = ++y;
    }

    for (; (x + 3) < m; x += 4) {
        var e1 = t.charCodeAt(x);
        var e2 = t.charCodeAt(x + 1);
        var e3 = t.charCodeAt(x + 2);
        var e4 = t.charCodeAt(x + 3);
        c = x;
        b = x + 1;
        d = x + 2;
        g = x + 3;
        h = x + 4;
        for (y = 0; y < n; y++) {
            k = s.charCodeAt(y);
            a = p[y];
            if (a < c || b < c) {
                c = (a > b ? b + 1 : a + 1);
            }
            else {
                if (e1 !== k) {
                    c++;
                }
            }

            if (c < b || d < b) {
                b = (c > d ? d + 1 : c + 1);
            }
            else {
                if (e2 !== k) {
                    b++;
                }
            }

            if (b < d || g < d) {
                d = (b > g ? g + 1 : b + 1);
            }
            else {
                if (e3 !== k) {
                    d++;
                }
            }

            if (d < g || h < g) {
                g = (d > h ? h + 1 : d + 1);
            }
            else {
                if (e4 !== k) {
                    g++;
                }
            }
            p[y] = h = g;
            g = d;
            d = b;
            b = c;
            c = a;
        }
    }

    for (; x < m;) {
        var e = t.charCodeAt(x);
        c = x;
        d = ++x;
        for (y = 0; y < n; y++) {
            a = p[y];
            if (a < c || d < c) {
                d = (a > d ? d + 1 : a + 1);
            }
            else {
                if (e !== s.charCodeAt(y)) {
                    d = c + 1;
                }
                else {
                    d = c;
                }
            }
            p[y] = d;
            c = a;
        }
        h = d;
    }

    return h;
} 

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  // var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   var year = a.getFullYear();
//   var month = months[a.getMonth()];
//   var date = a.getDate();
//   //var hour = a.getHours();
//   //var min = a.getMinutes();
//   //var sec = a.getSeconds();
//   var time = date + ' ' + month + ' ' + year;
//   //var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return a;
}