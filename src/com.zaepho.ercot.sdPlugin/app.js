/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />
/// <reference path="timers.js" />

const grid_conditions = new Action('com.zaepho.ercot.grid_conditions');
const grid_conditions_update_minutes = 5

let grid_conditions_interval = null;
/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
});

grid_conditions.onWillAppear(({ action, context, device, event, payload }) => {
	// Set to Unknown State to begin with
	console.log('grid_conditions.onWillAppear: Set Default State');
	//$SD.send(Events.setState, context, { "state": 4 })
	$SD.setTitle(context, "Unknown", Constants.hardwareAndSoftware);
	$SD.setState(context, 0);
	grid_conditions_update(context);
	console.log("initializing update interval");
	if (grid_conditions_interval) {
		console.log('clearing interval...', grid_conditions_interval);
        clearInterval(grid_conditions_interval);
        grid_conditions_interval = null;
	}
	grid_conditions_interval = setInterval(() => grid_conditions_update(context), grid_conditions_update_minutes * 60 * 1000);

});

grid_conditions.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('grid_conditions: onKeyup');
	grid_conditions_update(context);
});

function grid_conditions_update(context) {
	console.log('START: grid_conditions_update');
	// Grid Conditions JSON: 'https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json'
	let url = 'https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json';

	console.log("Fetching data...");
	getJSON(url).then(data => {
		console.log(data);
		console.log('state: ' + data.current_condition.state);
		// var humanFormat = require("human-format");
		var wattScale = new humanFormat.Scale.create(
			["MW", "GW"], 
			1000
		);
		let prc_value = humanFormat(
			parseFloat(data.current_condition.prc_value.replaceAll(',', '')), 
			{
				scale: wattScale,
				maxDecimals: 1
		});
		
		let title = prc_value;
		let state_int = data.current_condition.eea_level + 1
		
		console.log('set title: ' + title);
		$SD.setTitle(context, title, Constants.hardwareAndSoftware);
		console.log('set state: ' + state_int);
		$SD.setState(context, Number(state_int));
	}).catch(error => {
		console.error(error);
		// set unknown state and throw warning icon
	});
};

const getJSON = async url => {
	const response = await fetch(url);
	if (!response.ok) // check if response worked (no 404 errors etc...)
		throw new Error(response.statusText);

	const data = response.json(); // get JSON from the response
	return data; // returns a promise, which resolves to this data value
};
function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
};