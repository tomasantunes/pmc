import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import config from "../config";
import Sidebar from './Sidebar';
import { i18n } from '../libs/translations';

export default function Alerts() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  async function loadAlerts() {
    try {
      let res = await axios.get("/list-alerts");
      if (res.data.status === "OK") {
        setAlerts(res.data.data);
      }
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
                  <th>{i18n("Next Run")}</th>
                  <th>{i18n("Cron Expression")}</th>
                  <th>{i18n("Text")}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, idx) => (
                  <tr key={a.id}>
                    <td>{idx}</td>
                    <td>{a.id}</td>
                    <td>{a.nextRun || ""}</td>
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
