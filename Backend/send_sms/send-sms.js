const { Vonage } = require('@vonage/server-sdk');
const { Channels } = require('@vonage/messages');

const vonage = new Vonage({
  apiKey: 'b999620e',
  apiSecret: 'YwuoMC@uefHDAlE2B2L8kbV(K',
});

vonage.messages
  .send({
    messageType: 'text',
    channel: Channels.SMS,
    text: 'This is an SMS text message sent using the Vonage Messages API',
    to: '51926161858',
    from: '51926161858',    
  })
  .then(({ messageUUID }) => {
    console.log('Mensaje enviado:', messageUUID);
  })
  .catch((error) => {
    console.error('Error enviando SMS:', error);
  })