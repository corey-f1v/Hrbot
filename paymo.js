const request = require("request");
// let {
// 	user: userInfo
// } = await client.users.info({
// 	user: event.user,
// 	token: process.env.SLACK_BOT_TOKEN
// });
const paymoProjectUrl = "https://app.paymoapp.com/api/projects";
const paymoTaskUrl = "https://app.paymoapp.com/api/tasks";
const apiKey = process.env.PAYMO_API_KEY;
const authObj = {
	auth: {
		user: apiKey
	},
	headers: {
		Accept: "application/json"
	}
};

let todayDate = new Date();
const dd = String(todayDate.getDate()).padStart(2, "0");
const mm = String(todayDate.getMonth() + 1).padStart(2, "0"); //January is 0!
const yyyy = todayDate.getFullYear();
todayDate = `${yyyy}-${mm}-${dd}`;

async function requestPaymo(username, pub) {
	request.get(paymoProjectUrl, authObj, (error, response, body) => {
		if (error) {
			console.log(`Error in paymo request. Error: ${error}`);
		}
		JSON.parse(body).projects.forEach(project => {
			request.get(
				`${paymoTaskUrl}?where=project_id=${project.id}`,
				authObj,
				(error, response, body) => {
					if (error) {
						console.log(error);
					}
					console.log("tasks", JSON.parse(body).tasks);
					JSON.parse(body).tasks.forEach(task => {
						if (task.name.includes(username)) {
							pub(
								`Project: ${project.name} - ${task.name} - taskId: ${task.id}`
							);
						}
					});
				}
			);
		});
	});
}

function requestHours(task_id, pub) {
	const postData = {
		task_id,
		start_time: `${todayDate}T14:00:00Z`,
		end_time: `${todayDate}T22:00:00Z`,
		description: "Time entry created by Slackbot."
	};
	request.post({
			url: "https://app.paymoapp.com/api/entries",
			body: JSON.stringify(postData),
			headers: {
				"Content-type": "application/json",
				Accept: "application/json"
			},
			auth: {
				user: process.env.PAYMO_API_KEY
			}
		},
		(error, response, body) => {
			if (!error) {
				console.log("Hours response: ", JSON.parse(body));
				if (JSON.parse(body).message) {
					pub(`${JSON.parse(body).message}`);
				} else {
					pub(`${JSON.parse(body).entries[0].description}`);
				}
			} else {
				console.log(error);
			}
		}
	);
}

async function requestTimesheet(username, task_id, pub) {
	const postData = {
		task_id,
		start_time: `${todayDate}T14:00:00Z`,
		end_time: `${todayDate}T22:00:00Z`,
		description: "Time entry created by Slackbot."
	};
	request.post({
			url: "https://app.paymoapp.com/api/entries",
			body: JSON.stringify(postData),
			headers: {
				"Content-type": "application/json",
				Accept: "application/json"
			},
			auth: {
				user: process.env.PAYMO_API_KEY
			}
		},
		(error, response, body) => {
			if (error) {
				console.log(
					`There is an error with your timesheet request. Error: ${error}`
				);
			}
			console.log("Hours response: ", JSON.parse(body));
			JSON.parse(body).message ?
				pub(`${JSON.parse(body).message}`) :
				pub(`${JSON.parse(body).entries[0].description}`);
		}
	);
}

module.exports = {
	requestTimesheet,
	requestHours,
	requestPaymo
}