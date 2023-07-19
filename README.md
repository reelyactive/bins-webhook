bins-webhook
============

Webhook to forward the identifiers of detected bins to a remote server.


Quick Start
-----------

Clone this repository, install package dependencies with `npm install`, and then from the root folder run at any time:

    npm start

if using UDP raddecs as a data source, or:

    npm run csl

if using a CSL reader as a data source.


Configuration
-------------

Create a file called __options.json__ in the /config folder and include any of the properties of the following JSON:

    {
        "hostname": "localhost",
        "port": 3001,
        "useHttps": false,
        "customHeaders": {},
        "heartbeatMilliseconds": 60000,
        "mixingDelayMilliseconds": 10000,
        "numberOfDecodingsThreshold": 5,
        "signalAppearanceMilliseconds": 5000,
        "csl463SignalAppearance": false
    }

the default values of the properties are shown above.  Each of the start scripts will reference this file, if present.


Signal Appearance
-----------------

The detection (appearance) of a new bin can optionally be signalled on a general-purpose output of the CSL463 reader by setting the `csl463SignalAppearance` option to `true`.

In this case, GPO1 will be closed when a new bin appears and opened after `signalAppearanceMilliseconds`.  If multiple bins appear within the signal window, GPO1 will be opened `signalAppearanceMilliseconds` after the last bin appears within the window.


License
-------

MIT License

Copyright (c) 2023 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.