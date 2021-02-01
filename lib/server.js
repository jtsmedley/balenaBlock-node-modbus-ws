require('dotenv').config();
const pm2 = require('pm2');
const serverConfigurations = require('require-all')(process.env.SERVER_CONFIGURATIONS_PATH);
const validator = require('validator');
const process = require('process');

function startProcess(serverConfiguration) {
  pm2.connect(async function(err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    pm2.start(serverConfiguration, function (pm2startErr, apps) {
      if (pm2startErr) {
        console.error(err);
        return;
      }
      console.info(`${serverConfiguration.name} was started at ${Date.now()}`);
    });
  })
}

function parseConfig(serverConfiguration) {
  let interpreterArgs = [];
  let protocolSelected = false;

  if(serverConfiguration.cache === false) {
    interpreterArgs.push('-c');
  }

  if(typeof serverConfiguration.serial === 'string') {
    protocolSelected = 'RTU';
    interpreterArgs.push('-s ' + serverConfiguration.serial);
  }

  if(typeof serverConfiguration.ipAddr === 'string') {
    protocolSelected = 'TCP';
    if(!validator.isIP(serverConfiguration.ipAddr, 4)) {
      throw new Error('IP Address is not Valid');
    }
    interpreterArgs.push('-i ' + serverConfiguration.ipAddr);
  }

  if(protocolSelected === false) {
    throw new Error('No Protocol Info');
  }

  startProcess({
    "name": serverConfiguration.name,
    "script": "node_modules/modbus-ws/bin/modbus-ws.js",
    "interpreter": "node",
    "interpreter_args": interpreterArgs.join(' '),
    "autorestart": serverConfiguration.autorestart
  });
}

for (let serverConfiguration of serverConfigurations) {
  try {
    parseConfig(serverConfiguration);
  } catch (err) {
    console.error(err);
  }
}
