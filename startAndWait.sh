#!/bin/bash

# Start the 'yarn start:ci' command in the background
yarn start:ci &

# Set the initial values for the timer and timeout
elapsed_time=0
timeout=120
port_check_interval=5

# Function to check if the port is active
check_port() {
  netstat -tuln | grep -q ":$1 "
}

# Wait for port 3000 to become active or timeout
while ! check_port 3000 && [ $elapsed_time -lt $timeout ]; do
  sleep $port_check_interval
  elapsed_time=$((elapsed_time + port_check_interval))
  echo "Waiting for port 3000 to become active... Elapsed time: ${elapsed_time}s"
done

# Check if the port is active or if the script timed out
if check_port 3000; then
  echo "Port 3000 is now active."
else
  echo "Timeout reached. Port 3000 did not become active within 2 minutes."
  # Terminate the background process
