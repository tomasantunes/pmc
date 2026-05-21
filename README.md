# pmc
Productivity Management Center - Made with Express and React

| ![PMC Screenshot 1](https://i.imgur.com/5D4XDye.png) |
|-|

| ![PMC Screenshot 2](https://i.imgur.com/CEBOxoc.png) |
|-|

| ![PMC Screenshot 3](https://i.imgur.com/Ss9h6EB.png) |
|-|

| ![PMC Screenshot 4](https://i.imgur.com/vVRnVIM.png) |
|-|

| ![PMC Screenshot 4](https://i.imgur.com/JysU01G.png) |
|-|

## How to run

```
Import database/create-tables.sql to MySQL
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
Copy and edit secret-config-base.json and rename it to secret-config.json
Copy and edit frontend/src/config-base.json and rename it to config.json
npm install
cd frontend
npm install
npm run build
cd ..
npm start
Go to localhost:PORT

```

## User Manual

### Configuration

On the file "secret-config.json" you will have to write the database credentials, redis URL and password, generate a session key, set your root username and password and define a port.

If you want email, you'll have to enter SMTP credentials and admin recipient email.

For the "ENVIRONMENT" variable you will have to choose between "UBUNTU", "MACOS" or "WINDOWS".

You can generate a Github token on your Github account's settings and an OpenAI API key on https://platform.openai.com

### Create new user

Run the command "node generate-license.js". The license will be printed on the console. You give this license to the user and then he can sign up to the app.

If you need to activate license for a certain user (for renewal):

node activate-license.js <user_id> <license_key>

## Note

The app is responsive, it's a PWA, it works on mobile and you can install it on your home screen. And you can set your browser to remember the password.
