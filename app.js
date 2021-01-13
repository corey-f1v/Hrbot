const { App } = require("@slack/bolt");
const { WebClient } = require("@slack/web-api");
const { google } = require("googleapis");
const { _ } = require("lodash");
const request = require("request");
const { requestPaymo, requestHours, requestTimesheet } = require("./paymo");
const { getSickDays, getVacationDays } = require("./gSheet");
const { createSickDayEvent, createVacationDayEvent } = require("./gCal");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const keyFile = "credentials.json";
const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/spreadsheets",
];

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes,
});

const client = new WebClient();

// Slack things

async function findConversation(name) {
  try {
    const result = await app.client.conversations.list({
      token: process.env.SLACK_BOT_TOKEN,
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        const conversationId = await channel.id;
        return conversationId;
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function publishMessage(channel, text) {
  try {
    const foundChannel = await findConversation(channel, app);
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: foundChannel,
      text: text,
    });
  } catch (error) {
    console.error(error);
  }
}

function publishTestMessage(text) {
  return publishMessage("hrbot-tests", text);
}

async function messageChannel(id, text) {
  try {
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: id,
      text: text,
    });
    return result;
  } catch (e) {
    console.log(e);
  }
}

async function findUser(userId) {
  const author = await client.users.info({
    user: userId,
    token: process.env.SLACK_BOT_TOKEN,
  });
  return author.user.profile.real_name;
}

// interactions

app.event("app_mention", async ({ event }) => {
  try {
    const { channel, text, user } = event;

    const hrTopics = [
      "sick",
      "vacation",
      "holidays",
      "holiday",
      "birthday",
      "poke",
      "tea",
      "time",
      "paymo",
      "help",
      "who",
    ];

    if (hrTopics.some((r) => text.split(" ").includes(r))) {
      const combined = [hrTopics, text.split(" ")].flat();
      const word = combined.filter((w, i) => combined.indexOf(w) !== i && w);
      const username = await findUser(event.user);

      if (word == "sick") {
        if (text.includes("many")) {
          const sickDays = await getSickDays(username, auth);
          console.log("sick", sickDays);
          publishTestMessage(`You have ${sickDays} sick day(s) remaining`);
        } else if (text.includes("set")) {
          createSickDayEvent(username, auth);
          setSickOrVacation({ username, sickOrVacation: 's', auth })
          publishTestMessage("Your sick day has been set");
        } else {
          publishTestMessage(
            "You can see how many sick days you have left or set a sick day by asking me"
          );
        }
      } else if (word == "vacation") {
        if (text.includes("many")) {
          const vacationDays = await getVacationDays(username, auth);
          publishTestMessage(
            `You have ${vacationDays} vacation day(s) remaining`
          );
        } else if (text.includes("set")) {
          createVacationDayEvent(username, auth);
          setSickOrVacation({ username, sickOrVacation: '1', auth })
          publishTestMessage("Your vacation day has been set");
        } else {
          publishTestMessage(
            "You can see how many vacation days you have left or set a vacation day by asking me"
          );
        }
      } else if ((word == "holiday") | (word == "holidays")) {
        // two posts
        // at 4:30pm night before check calendar for holiday and make post
        // at 9:00am check calendar for holiday and make post
        publishTestMessage("Holidays");
      } else if (word == "birthday") {
        // at 9:00am check calendar for birthday and make post
        publishTestMessage("Birthdays");
      } else if (word == "tea") {
        // Post video on tea
        publishTestMessage("Tea");
      } else if (word == "poke") {
        // Send an HR-approved poke to a friend
        publishTestMessage("poke");
      } else if (word == "paymo") {
        if (text.includes("timesheet")) {
          const taskId = text.toLowerCase().substring(text.indexOf("|") + 2);
          requestTimesheet(username, taskId, messageChannel, channel);
        } else if (text.includes("tasks")) {
          requestPaymo(username, messageChannel, channel);
        } else {
          publishTestMessage(
            "To add time to your Paymo timesheet, please type `@hrbot paymo timesheet | <taskId>`. If you're not sure of your taskId, please type `@hrbot paymo tasks` for a list."
          );
        }
      }
    } else {
      publishTestMessage(
        `Sorry, I may not be able to help you with that. These are the topics I have information on: ${hrTopics.join(
          ", "
        )}`
      );
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
