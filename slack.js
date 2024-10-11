import bolt from '@slack/bolt';
const { App } = bolt;
import { JSONFilePreset } from 'lowdb/node';
import haikus from "./haikus.json" with { type: "json" };;

export const db = await JSONFilePreset("users.db.json", { active: [], unsubscribed: [] });
console.log(await db.data);
export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

export async function registerHandlers() {
  app.command('/unsubscribe-haunting', async ({ ack, body, client }) => {
    await ack();
    try {
      let { user_id } = body;
      if (db.data.unsubscribed.indexOf(user_id) !== -1) {
        await client.chat.postMessage({
          channel: user_id,
          text: 'You are already unsubscribed from Haunt. If you would like to resubscribe, type `/subscribe-haunting`.'
        });
      } else {
        unsubscribeUser(user_id);
        await client.chat.postMessage({
          channel: user_id,
          text: 'You have been unsubscribed from Haunt. If you would like to resubscribe, type `/subscribe-haunting`.'
        });
      }
    } catch (error) {
      console.error(error);
    }
  });

  app.command('/subscribe-haunting', async ({ ack, body, client }) => {
    await ack();
    try {
      let { user_id } = body;
      if (db.data.unsubscribed.indexOf(user_id) === -1 && db.data.active.indexOf(user_id) !== -1) {
        await client.chat.postMessage({
          channel: user_id,
          text: 'You are already subscribed to Haunt. If you would like to unsubscribe, type `/unsubscribe-haunting`.'
        });
      } else {
        subscribeUser(user_id);
        await client.chat.postMessage({
          channel: user_id,
          text: 'You have been subscribed to Haunt. If you would like to unsubscribe, type `/unsubscribe-haunting`.'
        });
      }
    } catch (error) {
      console.error(error);
    }
  });

  app.start(process.env.SLACK_PORT);
}

export async function isValidId(slack_id) {
  try {
    let user = await app.client.users.info({
      user: slack_id
    });
    return true;
  }
  catch (e) {
    return false;
  }
}
export function isActiveUser(slack_id) {
  return db.data.active.indexOf(slack_id) !== -1;
}

export function isUnsubscribed(slack_id) {
  return db.data.unsubscribed.indexOf(slack_id) !== -1;
}

export async function subscribeUser(slack_id) {
  db.update(({ active }) => active.push(slack_id));
  db.data.unsubscribed = db.data.unsubscribed.filter((usr) => usr !== slack_id);
  await db.write();
}

export async function unsubscribeUser(slack_id) {
  db.update(({ unsubscribed }) => unsubscribed.push(slack_id));
  db.data.active = db.data.active.filter((usr) => usr !== slack_id);
  await db.write();
}

function getHaiku() {
  let ri = Math.floor(Math.random() * haikus.length);
  return haikus[ri];
}

export function createBatch(n) {
  let active = db.data.active.filter(usr => !isUnsubscribed(usr));
  let participants = [];
  for (let i = 0; i < Math.min(n, active.length); i++) {
    let ri = Math.floor(Math.random() * active.length);
    participants.push(active[ri]);
    active.splice(ri, 1);
  }
  return participants;
}

export async function bulkSend(participants) {
  for (let participant of participants) {
    await app.client.chat.postMessage({
      channel: participant,
      text: `${getHaiku()}\n\nYou have been haunted! :ghost:`
    });
  }
}
