import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import config from "../config";
import Sidebar from './Sidebar';

export default function Alerts() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cronJobs, setCronJobs] = useState([]);
  const navigate = useNavigate();

  function loadAlerts() {
    axios.get(config.BASE_URL + "/list-cron-jobs")
      .then(function (response) {
        console.log(response.data.data);
        if (response.data.status == "OK") {
          setCronJobs(response.data.data);
        }
        else {
          console.log("Error: " + response.data.error);
        }
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
    loadAlerts();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
            <h1>Alerts</h1>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>IDX</th>
                  <th>ID</th>
                  <th>Next Run</th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((c) => (
                  <tr key={c.idx}>
                    <td>{c.idx}</td>
                    <td>{c.id}</td>
                    <td>{c.nextRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </>
    );
  }
  else {
    return (<></>);
  }
}
