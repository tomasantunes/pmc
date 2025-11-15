import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import config from "../config";
import Sidebar from './Sidebar';

export default function Alerts() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  async function loadAlerts() {
    try {
      let res1 = await axios.get("/list-cron-jobs");
      let res2 = await axios.get("/list-alerts");
      for (let i in res1.data.data) {
        res1.data.data[i].cron_string = res2.data.data[i].cron_string;
        res1.data.data[i].text = res2.data.data[i].text;
      }
      setAlerts(res1.data.data);
    } catch(e) {
      console.log(e);
    }
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
                  <th>Cron Expression</th>
                  <th>Text</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.idx}>
                    <td>{a.idx}</td>
                    <td>{a.id}</td>
                    <td>{a.nextRun}</td>
                    <td>{a.cron_string}</td>
                    <td>{a.text}</td>
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
