/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const grid_conditions = new Action('com.zaepho.ercot.grid_conditions');

/**
 * The first event fired when Stream Deck starts
 */
$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');
});

grid_conditions.onKeyUp(({ action, context, device, event, payload }) => {
	console.log('Your key code goes here!');
	// Grid Conditions JSON:
	// https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json
});

