# pmc
Productivity Management Center - Made with Express and React

| ![PMC Screenshot 1](https://i.imgur.com/J9S52Ip.png) |
|-|

| ![PMC Screenshot 2](https://i.imgur.com/bbBdeUn.png) |
|-|

| ![PMC Screenshot 3](https://i.imgur.com/bbBdeUn.png) |
|-|

## How to run

```
Import database/create-tables.sql to MySQL
Copy and edit secret-config-base.json and rename it to secret-config.json
Copy and edit frontend/src/config-base.json and rename it to config.json
npm install
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..
npm start
Go to localhost:4002
```

## User Manual

### Configuration

On the file "secret-config.json" you will have to write the database credentials, generate a session key, set your username and password to enter the app.

For the "ENVIRONMENT" variable you will have to choose between "UBUNTU", "MACOS" or "WINDOWS".

You can generate a Github token on your Github account's settings and an OpenAI API key on https://platform.openai.com

### Creating folders

On the sidebar press "Add Folder", type the name of the folder and select between "Simple", "Recurrent" or "List".

Simple folders will have a To-Do List where you can create tasks and check them as you do them. You can also star tasks so they go to the top. For each task you can define a description, a start date and time and an end date and time.

Recurrent folders will have a weekly grid of checkboxes that you can check every day. You can set a start time and an end time for each task. You can also define the specific days of the week when you will do those tasks.

There is an option to cancel today's task and to restart the counter for a task.

List folders will just display a list of items.

### Github tasks

On this page will be displayed the tasks from any TODO.md files that you have on the root of your repos and any open issues on your repos.

### Motivation

CURRENTLY UNAVAILABLE

### Random Task

This page will display a random task from any folder that isn't done.

### Schedule

CURRENTLY NOT WORKING CORRECTLY

## Calendar

On this page you can see events weekly in a timetable or a list and you can create new events. If you set a start datetime and end datetime on a simple task it will automatically generate an event.



