'use strict';

const dotenv = require('dotenv').config();

const axios = require('axios')
const http = require('http');
const https = require('https');
var fs = require('fs');

// The device connection string to authenticate the device with your IoT hub.
//
// NOTE:
// For simplicity, this sample sets the connection string in code.
// In a production environment, the recommended approach is to use
// an environment variable to make it available to your application
// or use an HSM or an x509 certificate.
// https://docs.microsoft.com/azure/iot-hub/iot-hub-devguide-security
//
// Using the Azure CLI:
// az iot hub device-identity show-connection-string --hub-name {YourIoTHubName} --device-id MyNodeDevice --output table
//var connectionString = process.env.CONNECTION_STRING;
//console.log(process.env);

// Using the Node.js Device SDK for IoT Hub:
//   https://github.com/Azure/azure-iot-sdk-node
// The sample connects to a device-specific MQTT endpoint on your IoT Hub.
var Mqtt = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message;

var myArgs = process.argv.slice(2);
deploy(myArgs[0]);

function deploy(model_url) {
  
  var genesisModel = '';
  
  https.get(model_url, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
  
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } 
    //else if (!/^application\/json/.test(contentType)) {
    //  error = new Error('Invalid content-type.\n' +
    //                    `Expected application/json but received ${contentType}`);
    //}
    if (error) {
      console.error(error.message);
      // Consume response data to free up memory
      res.resume();
      return;
    }
  
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        genesisModel = JSON.parse(rawData);
        console.log(genesisModel);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
  
  axios.post('http://127.0.0.1:8880/genesis/deploy', genesisModel)
  .then((res) => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(res)
  })
  .catch((error) => {
    console.error(error)
  })  
}

// Function to handle the TriggerDeployment direct method call from IoT hub
function onTriggerDeployment(request, response) {
  
  // Function to send a direct method reponse to your IoT hub.
  function directMethodResponse(err) {
    if(err) {
      console.error('send error: ' + err.toString());
    } else {
      console.log('Response to method \'' + request.methodName + '\' sent successfully.');
    }
  }
  deploy(request.payload);
}

// Set up the handler for the TriggerDeployment l direct method call.
//var client = DeviceClient.fromConnectionString(process.env.CONNECTION_STRING, Mqtt);
//client.onDeviceMethod('TriggerDeployment', onTriggerDeployment);