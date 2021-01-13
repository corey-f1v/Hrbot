const {
	google
} = require("googleapis");

const calendarId =
	"f1v.co_tthcm1hbtv21rlpaso7pliirmo@group.calendar.google.com";

async function createEvent(summary, date, auth) {
	const event = {
		end: {
			date
		},
		start: {
			date
		},
		description: "-",
		summary
	};
	const calendar = google.calendar({
		version: "v3",
		auth
	});
	calendar.events.insert({
			auth,
			calendarId,
			resource: event
		},
		function (err, event) {
			if (err) {
				console.log(
					"There was an error contacting the Calendar service: " + err
				);
				return;
			}
			console.log("Event created yo");
		}
	);
}

async function createManyEvent(summary, start, end, description, auth) {
	const event = {
		end: {
			date: `${end}`,
		},
		start: {
			date: `${start}`,
		},
		description: `${description}`,
		summary
	};
	const calendar = google.calendar({
		version: "v3",
		auth
	});
	calendar.events.insert({
			auth,
			calendarId,
			resource: event,
		},
		function (err, event) {
			if (err) {
				console.log(
					"There was an error contacting the Calendar service: " + err
				);
				return;
			}
		}
	);
}

function getDate() {
	var today = new Date();
	var dd = today.getDate();

	var mm = today.getMonth() + 1;
	var yyyy = today.getFullYear();
	if (dd < 10) {
		dd = "0" + dd;
	}

	if (mm < 10) {
		mm = "0" + mm;
	}
	today = yyyy + "-" + mm + "-" + dd;
	return today;
}

function createSickDayEvent(username, date, auth) {
	createEvent(`${username} - OOO - Sick`, date, auth);
}

function createManySickDayEvent(username, start, end, auth) {
	createManyEvent(`${username} - OOO - Sick`, start, end, '-', auth);
}

function createVacationDayEvent(username, date, auth) {
	createEvent(`${username} - OOO - Vacation`, date, auth);
}

function createManyVacationDayEvent(username, start, end, auth) {
	createManyEvent(`${username} - OOO - Vacation`, start, end, '-', auth);
}

module.exports = {
	createSickDayEvent,
	createVacationDayEvent,
	getDate,
	createManySickDayEvent,
	createManyVacationDayEvent
}