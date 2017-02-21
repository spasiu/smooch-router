const triggers = {
  'somethingsomething': 'somethingalert',
  'taco': 'tacoalert'
};

const https = require('https');
const qs = require('querystring');

const verificationToken = process.env.VERIFICATION_TOKEN;
const accessToken = process.env.ACCESS_TOKEN;
const dispatchChannelId = process.env.DISPATCH_CHANNEL_ID;

const handleVerification = (data, cb) => {
    if (data.token === verificationToken) {
        return cb(null, data.challenge);
    }

    cb("verification failed");
};

const handleEvents = (data, cb) => {
    // respond fast
    cb(null);

    if (data.token !== verificationToken) {
        return cb(null);
    }

    if (!data.event.bot_id) {
        return;
    }

    const dispatchMessages = [];

    for (const attachment of data.event && data.event.attachments || []) {
      for (const trigger in triggers) {
          console.log('MESSAGE:', attachment.pretext, trigger, attachment.pretext.indexOf(trigger) >= 0);
          if (attachment.pretext.indexOf(trigger) >= 0) {
              dispatchMessages.push(triggers[trigger]);
          }
      }
    }

    if (dispatchMessages.length === 0) {
        return cb(null);
    }

    const text = `${dispatchMessages.join(' ')} in <#${data.event.channel}>`;

    https.get('https://slack.com/api/chat.postMessage?' + qs.stringify({
        token: accessToken,
        channel: dispatchChannelId,
        text: text
    }));
};

const handlers = {
    url_verification: handleVerification,
    event_callback: handleEvents
};

exports.handler = (data, context, cb) => {
    const handler = handlers[data.type] || (() => cb(null));
    handler(data, cb);
};
