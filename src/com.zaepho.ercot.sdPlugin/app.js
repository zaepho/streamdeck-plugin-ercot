/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />
/// <reference path="timers.js" />
/// <reference path="humanformat.js" />

const grid_conditions = new Action('com.zaepho.ercot.grid-conditions');
const grid_conditions_update_minutes = 5

let grid_conditions_interval = null;
/**
 * The first event fired when Stream Deck starts
 * 
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	logMessage(context, 'Stream Deck connected!');	
});

grid_conditions.onWillAppear(({ action, context, device, event, payload }) => {
	// Set to Unknown State to begin with
	logMessage(context, 'grid_conditions.onWillAppear: Set Default State');
	$SD.send(Events.setState, context, { "state": 0 })
	$SD.setImage(
		context, 
		`data:image/svg+xml;charset=utf8,${getGridConditionSVG(0, "")}`,
		0, 
		Constants.hardwareAndSoftware
	);
	grid_conditions_update(context);
	logMessage(context, "initializing update interval");
	if (grid_conditions_interval) {
		logMessage(context, 'clearing interval...', grid_conditions_interval);
        clearInterval(grid_conditions_interval);
        grid_conditions_interval = null;
	}
	grid_conditions_interval = setInterval(() => grid_conditions_update(context), grid_conditions_update_minutes * 60 * 1000);

});

// TODO: Clear interval when disappearing

grid_conditions.onKeyUp(({ action, context, device, event, payload }) => {
	logMessage(context, 'grid_conditions: onKeyup');
	grid_conditions_update(context);
});

function logMessage(context, msg) {
	console.log(msg);
	$SD.send(Events.logMessage, context, {"message": msg});
}

function grid_conditions_update(context) {
	logMessage(context, 'START: grid_conditions_update');
	// Grid Conditions JSON: 'https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json'
	let url = 'https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json';

	logMessage(context, "Fetching data...");
	getJSON(url).then(data => {
		logMessage(context, data);
		logMessage(context, 'current_condition state: ' + data.current_condition.state);
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
		
		let state_int = data.current_condition.eea_level + 1
		logMessage(context, 'set state: ' + state_int);
		let svg_str = `data:image/svg+xml;charset=utf8,${getGridConditionSVG(state_int, prc_value)}`;
		logMessage(context, 'svg_str: ' + svg_str);
		$SD.setImage(
			context, 
			svg_str,
			0, 
			Constants.hardwareAndSoftware
		);
	}).catch(error => {
		console.error(error);
		logMessage(context, error);
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

function getGridConditionSVG(level_int, prc_value) {
	let level_str = `level${level_int}`
	let condition_title = ""
	switch (level_int) {
		case 1:
			condition_title = "Normal Conditions";
			break;
		case 2:
			condition_title = "Conservation";
			break;
		case 3:
			condition_title = "Emergency Lvl 1";
			break;
		case 4:
			condition_title = "Emergency Lvl 2";
			break;
		case 5:
			condition_title = "Emergency Lvl 3";
			break;
		default:
		case 0:
			condition_title = "Unknown";
			break;
	}
	let svgTemplate = `
		<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" version="1.1" xml:space="preserve">
			<style>
				g.level0 {
					fill: #3A3B3C;
					fill-opacity: 100;
					stroke: #3A3B3C;
					stroke-opacity: 100;
				}
				g.level1 {
					fill: #26d07c;
					fill-opacity: 100;
					stroke: #26d07c;
					stroke-opacity: 100;
				}
				rect {
					fill: #000000;
					stroke: #000000;
				}
				g.level2 {
					fill: #ffd100;
					fill-opacity: 100;
					stroke: #ffd100;
					stroke-opacity: 100;
				}
				g.level2 > #dial5, 
				g.level3 > #dial5, g.level3 > #dial4, 
				g.level4 > #dial5, g.level4 > #dial4, g.level4 > #dial3, 
				g.level5 > #dial5, g.level5 > #dial4, g.level5 > #dial3, g.level5 > #dial2 {
					fill-opacity: 0;
				}
				g.level3 {
					fill: #ff8200;
					fill-opacity: 100;
					stroke: #ff8200;
					stroke-opacity: 100;
				}
				g.level4 {
					fill: #d5392e;
					fill-opacity: 100;
					stroke: #d5392e;
					stroke-opacity: 100;
				}
				g.level5 {
					fill: #000000;
					fill-opacity: 100;
					stroke: #000000;
					stroke-opacity: 100;
				}
				g.level5 > rect {
					fill: #d5392e;
					stroke: #d5392e;
				}
			</style>
			<g class="${level_str}">
			<title>${condition_title}</title>
			<rect id="background" width="300" height="300" /> 
			<text id="title" stroke-width="0" x="150" y="50" text-anchor="middle" font-size="36" font-family="Newsreader" xml:space="preserve">
			${condition_title}
			</text>
			<path id="dial5" class="st0"
				d="m270.81444,137.67406l-25.65,18.64c-1.5,1.09 -1.9,3.16 -0.9,4.73c9.73,15.27 15.84,33.06 17.15,52.17c0.13,1.84 1.67,3.26 3.51,3.26l31.55,0c2.03,0 3.63,-1.71 3.52,-3.73c-1.39,-27.24 -10.08,-52.59 -24.14,-74.13c-1.1,-1.7 -3.4,-2.13 -5.04,-0.94z" />
			<path id="dial4" class="st0"
				d="m240.39444,149.84915l25.69,-18.66c1.64,-1.19 1.93,-3.51 0.66,-5.09c-16.48,-20.35 -38.17,-36.32 -63.02,-45.86c-1.89,-0.73 -4.01,0.27 -4.64,2.2l-9.87,30.37c-0.57,1.76 0.31,3.67 2.03,4.35c17.36,6.9 32.58,18.03 44.39,32.12c1.19,1.41 3.27,1.65 4.76,0.57z" />
			<path id="dial3" class="st0"
				d="m151.00444,108.99c9.44,0 18.61,1.17 27.37,3.38c1.79,0.45 3.62,-0.57 4.2,-2.33l9.88,-30.4c0.63,-1.93 -0.5,-3.98 -2.45,-4.5c-12.45,-3.35 -25.52,-5.14 -39,-5.14c-13.48,0 -26.55,1.79 -38.99,5.14c-1.96,0.53 -3.08,2.58 -2.45,4.5l9.88,30.4c0.57,1.76 2.4,2.78 4.2,2.33c8.75,-2.2 17.92,-3.38 27.36,-3.38z" />
			<path id="dial2" class="st0"
				d="m110.79444,112.80915l-9.87,-30.37c-0.63,-1.93 -2.75,-2.93 -4.64,-2.2c-24.85,9.55 -46.53,25.52 -63.02,45.87c-1.28,1.58 -0.98,3.9 0.66,5.09l25.69,18.66c1.49,1.08 3.57,0.84 4.76,-0.58c11.81,-14.09 27.03,-25.22 44.39,-32.12c1.71,-0.68 2.6,-2.59 2.03,-4.35z" />
			<path id="dial1" class="st0"
				d="m54.84444,156.31407l-25.65,-18.64c-1.64,-1.19 -3.93,-0.76 -5.04,0.94c-14.06,21.54 -22.75,46.88 -24.15,74.13c-0.1,2.02 1.5,3.73 3.52,3.73l31.55,0c1.84,0 3.38,-1.42 3.51,-3.26c1.31,-19.11 7.43,-36.9 17.15,-52.17c1.01,-1.57 0.61,-3.64 -0.89,-4.73z" />
			<text id="title" stroke-width="0" x="150" y="285" text-anchor="middle" font-size="64" font-family="Newsreader" xml:space="preserve">
			${prc_value}
			</text>
			</g>
		</svg>`
	return svgTemplate;
}