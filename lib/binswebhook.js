/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const Barnowl = require('barnowl');
const http = require('http');
const https = require('https');
const execFile = require('child_process').execFile;


const DEFAULT_HEARTBEAT_MILLISECONDS = 60000;
const DEFAULT_MIXING_DELAY_MILLISECONDS = 10000;
const DEFAULT_NUMBER_OF_DECODINGS_THRESHOLD = 5;
const DEFAULT_BINS_PATH = '/bins';
const DEFAULT_USE_HTTPS = false;
const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = 3001;
const DEFAULT_CUSTOM_HEADERS = {};
const DEFAULT_SIGNAL_APPEARANCE_MILLISECONDS = 5000;
const DEFAULT_CS463_SIGNAL_APPEARANCE = false;


/**
 * BinsWebhook Class
 * Webhook to forward the identifiers of detected bins.
 */
class BinsWebhook {

  /**
   * BinsWebhook constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.useHttps = options.useHttps || DEFAULT_USE_HTTPS;
    this.hostname = options.hostname || DEFAULT_HOSTNAME;
    this.port = options.port || DEFAULT_PORT;
    this.customHeaders = options.customHeaders || DEFAULT_CUSTOM_HEADERS;
    this.heartbeatMilliseconds = options.heartbeatMilliseconds ||
                                 DEFAULT_HEARTBEAT_MILLISECONDS;
    this.mixingDelayMilliseconds = options.mixingDelayMilliseconds ||
                                   DEFAULT_MIXING_DELAY_MILLISECONDS;
    this.numberOfDecodingsThreshold = options.numberOfDecodingsThreshold ||
                                      DEFAULT_NUMBER_OF_DECODINGS_THRESHOLD;
    this.signalAppearanceMilliseconds = options.signalAppearanceMilliseconds ||
                                        DEFAULT_SIGNAL_APPEARANCE_MILLISECONDS;
    this.cs463SignalAppearance = DEFAULT_CS463_SIGNAL_APPEARANCE;

    if(options.hasOwnProperty('cs463SignalAppearance')) {
      self.cs463SignalAppearance = options.cs463SignalAppearance;
    }

    this.devices = new Map();
    this.previousDeviceIds = [];
    this.signalAppearanceTimeoutId;
    this.barnowl = new Barnowl({
        enableMixing: true,
        mixingDelayMilliseconds: self.mixingDelayMilliseconds
    });

    if(this.useHttps) {
      this.agent = new https.Agent({ keepAlive: true });
    }
    else {
      this.agent = new http.Agent({ keepAlive: true });
    }

    this.barnowl.on('raddec', (raddec) => { handleRaddec(raddec, self); });

    setTimeout(postBins, self.heartbeatMilliseconds, self);

    console.log('bins-webhook POSTing updates every',
                Math.round(self.heartbeatMilliseconds / 1000),
                'seconds to', self.hostname + ':' + self.port +
                DEFAULT_BINS_PATH);
  }

  /**
   * Add a barnowl listener.
   * @param {Object} listener The barnowl listener parameters.
   */
  addListener(interfaceClass, interfaceOptions,
              listenerClass, listenerOptions) {
    this.barnowl.addListener(interfaceClass, interfaceOptions,
                             listenerClass, listenerOptions);
  }

}


/**
 * Handle the given raddec.
 * @param {Raddec} raddec The radio-decodings of a bin.
 * @param {BinsWebhook} instance The BinsWebhook instance.
 */
function handleRaddec(raddec, instance) {
  let numberOfDecodings = 0;

  raddec.rssiSignature.forEach((entry) => {
    numberOfDecodings += entry.numberOfDecodings;
  });

  if(instance.devices.has(raddec.transmitterId)) {
    numberOfDecodings += instance.devices.get(raddec.transmitterId);
  }
  else if(!instance.previousDeviceIds.includes(raddec.transmitterId)) {
    handleNewDevice(instance);
  }

  instance.devices.set(raddec.transmitterId, numberOfDecodings);
}


/**
 * Handle the detection of a new device.
 * @param {BinsWebhook} instance The BinsWebhook instance.
 */
function handleNewDevice(instance) {
  if(instance.cs463SignalAppearance) {
    clearTimeout(instance.signalAppearanceTimeoutId);
    execFile('/opt/inf_out_set', [ '0', '1' ]);
    instance.signalAppearanceTimeoutId =
                             setTimeout(handleSignalAppearanceTimeout,
                                        instance.signalAppearanceMilliseconds);
  }
}


/**
 * Handle the timeout of an appearance signal.
 */
function handleSignalAppearanceTimeout() {
  execFile('/opt/inf_out_set', [ '0', '0' ]);
}


/**
 * POST the bins identifiers.
 * @param {BinsWebhook} instance The BinsWebhook instance.
 */
function postBins(instance) {
  let binIdentifiers = [];

  instance.devices.forEach((numberOfDecodings, transmitterId) => {
    if(numberOfDecodings > instance.numberOfDecodingsThreshold) {
      binIdentifiers.push(transmitterId);
    }
  });
  instance.previousDeviceIds = Array.from(instance.devices.keys());
  instance.devices.clear();

  let req;
  let data = JSON.stringify(binIdentifiers);
  let headers = {
      "Content-Type": "application/json",
      "Content-Length": data.length
  };

  let options = {
      hostname: instance.hostname,
      port: instance.port,
      path: DEFAULT_BINS_PATH,
      agent: instance.agent,
      method: 'POST',
      headers: Object.assign(headers, instance.customHeaders)
  };

  if(instance.useHttps) {
    req = https.request(options, handleRes);
  }
  else {
    req = http.request(options, handleRes);
  }

  req.on('error', handleError);
  req.write(data);
  req.end();

  setTimeout(postBins, instance.heartbeatMilliseconds, instance);
}


/**
 * Handle the given raddec.
 * @param {Object} res The POST result.
 */
function handleRes(res) {
  if(res.statusCode !== 200) {
    // Handle non-OK server responses here, if required
  }
}


/**
 * Handle the given POST error.
 * @param {Error} error The POST error.
 */
function handleError(err) {
  console.log('Error:', err.code, 'POSTing to', err.address + ':' + err.port);
}


module.exports = BinsWebhook;