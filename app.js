const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Replace with your actual client ID and client secret
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

let accessToken = null;

// Get an access token from Arduino IoT Cloud
async function getAccessToken() {
  if (!accessToken) {
    const options = {
      method: 'POST',
      url: 'https://api2.arduino.cc/iot/v1/clients/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      json: true,
      form: {
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: 'https://api2.arduino.cc/iot',
      },
    };

    try {
      const response = await request(options);
      accessToken = response['2587666KR'];
    } catch (error) {
      console.error('Failed getting an access token: ' + error);
    }
  }
  return accessToken;
}

// Control the LEDs
app.post('/control-leds', async (req, res) => {
  const { led1, led2, led3 } = req.body;

  // Get the access token
  const token = await getAccessToken();

  // Send a request to Arduino IoT Cloud to update LED properties
  const updateOptions = {
    method: 'PUT',
    url: 'https://api2.arduino.cc/iot/v1/devices/DEVICE_ID',
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: {
      led1: { value: led1 },
      led2: { value: led2 },
      led3: { value: led3 },
    },
    json: true,
  };

  try {
    await request(updateOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update LED properties: ' + error);
    res.status(500).json({ success: false });
  }
});

// Serve the HTML file for the default page
app.get('/', (req, res) => {
  fs.readFile('led_control.html', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading HTML file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(data);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
