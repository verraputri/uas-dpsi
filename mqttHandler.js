const mqtt = require('mqtt');
const config = require('./config');
const db = require('./db');
const mqttClient = mqtt.connect(config.mqtt.broker);

const sensorMsg = {};

mqttClient.on('connect', () => {
  console.log('Terhubung dengan MQTT Broker');
  config.mqtt.topic.forEach((topic) => {
    mqttClient.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to ${topic}`);
      } else {
        console.error(`Failed to subscribe to ${topic}: ${err}`);
      }
    });
  });
});

mqttClient.on('message', (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message}`);

  let cleanedTopic = topic.replace("/plantix/", "");
  if (cleanedTopic == 'pompa') {
    const pompaMsg = {};
    pompaMsg[cleanedTopic] = message.toString();
    pompaMsg['sumber'] = 'arduino';
    pompaMsg['tgl_terima'] = new Date();
    db.tinsert('dat_pompa', pompaMsg);
  }
  else {
    sensorMsg[cleanedTopic] = message.toString();
    const subscribedTopics = ['temp', 'airhumid', 'ldrval', 'lightint', 'soilhumidval', 'tanaman_status'];
    const allTopicsReceived = subscribedTopics.every(subscribedTopic => sensorMsg.hasOwnProperty(subscribedTopic));
    if (allTopicsReceived) {
      sensorMsg['sumber'] = 'arduino';
      sensorMsg['tgl_terima'] = new Date();
      db.tinsert('dat_sensor', sensorMsg);
      Object.keys(sensorMsg).forEach(key => delete sensorMsg[key]);
    }
  }
});

module.exports = mqttClient;
