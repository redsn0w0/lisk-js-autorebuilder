#Lisk Anti-Stuck in js
Check if node is forging, if not it will rebuild with last available snapshot and activate the forging ones the sync is completed.
forever-autorebuild.log file is a collection of your delegate node fork | autorebuild | forging events

##Install
Clone the repository next to lisk-test (for instance)

HOME
    lisk-test
    lisk-js-autorebuilder

    - cd into lisk-js-autorebuilder
    - rename the config.sample.json in config.json and complete it with your delegate infos
    - npm install

##Run
Cd into the lisk-js-autorebuilder

    - forever start -l forever.log -o forever-autorebuild.log -e forever-autorebuild-err.log -a autorebuild.js
