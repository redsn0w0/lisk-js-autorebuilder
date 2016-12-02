#Lisk Anti-Stuck in js
**** NOT USE IT BEFORE STARTING FORGING ****

The script will check if your delegate is forging, if not it will rebuild with last available snapshot and activate the forging ones the sync is completed.

    - forever-autorebuild.log

The file is a collection of your delegate node fork | autorebuild | forging events

##Install
Clone the repository in the same directory of lisk installation folder, for instance:

```
/HOME DIRECTORY
    /lisk-test
    /lisk-js-autorebuilder
```

In the lisk-test (the lisk installation folder) check 127.0.0.1 is in the forging whitelist section in the config.json
In the cloned lisk-js-autorebuilder do as follow:

    - cd into lisk-js-autorebuilder
    - rename the config.sample.json in config.json
    - edit the config.json
            "delegate":"nameOfYourDelegate",
            "secret":"superSecretPasswd"
            "reloadTollerance":"(integer) Number of diff block tollerance compared to the higher blockchain height"
    - npm install

##Run
Cd into the lisk-js-autorebuilder

    - forever start -l forever.log -o forever-autorebuild.log -e forever-autorebuild-err.log -a autorebuild.js
