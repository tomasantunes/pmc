import React, {useState, useEffect} from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';
import config from '../config.json';

export default function RandomTask() {
  const [randomTask, setRandomTask] = useState("");

  function getRandomTask() {
    axios.get(config.BASE_URL + "/api/get-random-task")
    .then(function (response) {
      setRandomTask(response.data.data);
    })
    .catch(function (err) {
      console.log(err);
    });
  }

  useEffect(() => {
    getRandomTask();
  });

  return (
    <>
      <Sidebar />
      <div className="page">
        <h2>Random Task</h2>
        <h3>{randomTask}</h3>
      </div>
    </>
  )
}
