#!/bin/bash

OLDPATH=${PATH};
NODE="${PWD}/node/bin";
export PATH="${NODE}:${OLDPATH}";

if [ "$1" == "install" ]; then
    npm install $2 --save-dev;
    if [ "$2" == "electron" ]; then
	chmod 4755 "${PWD}/node_modules/electron/dist/chrome-sandbox";
    fi
fi

if [ "$1" == "uninstall" ]; then
    npm uninstall $2;
fi

export PATH="${OLDPATH}";
