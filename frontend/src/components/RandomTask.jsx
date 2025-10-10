import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import config from '../config.json';

export default function RandomTask() {
  const [randomTask, setRandomTask] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  function getRandomTask() {
    axios.get(config.BASE_URL + "/api/get-random-task")
    .then(function (response) {
      setRandomTask(response.data.data);
    })
    .catch(function (err) {
      console.log(err);
    });
  }

  function checkLogin() {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
      if (response.data.status === "OK") {
        setIsLoggedIn(true);
      }
      else {
        navigate('/login');
      }
    })
    .catch(error => {
      navigate('/login');
    });
  }

  useEffect(() => {
    checkLogin();
    getRandomTask();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <h2>Random Task</h2>
          <h3>{randomTask}</h3>
        </div>
      </>
    );
  }
  else {
    return (<></>);
  }
}
