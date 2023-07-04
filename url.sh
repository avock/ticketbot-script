#!/bin/bash

# Run Google Chrome with remote debugging enabled
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir') --incognito &

# Wait for Chrome to start
sleep 2

# Retrieve the WebSocket Debugger URL
json=$(curl -s http://localhost:9222/json/version)
url=$(echo "$json" | grep -o '"webSocketDebuggerUrl": "[^"]*' | grep -o 'ws://[^"]*')

# Replace "localhost" with "127.0.0.1"
url=$(echo "$url" | sed 's/localhost/127.0.0.1/')

# Print the modified URL
echo "WebSocket Debugger URL: $url"
echo "$url" | pbcopy
echo "URL copied to clipboard."