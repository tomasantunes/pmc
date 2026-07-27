import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from "axios";
import config from "../config";
import Sidebar from './Sidebar';
import { i18n } from '../libs/translations';

export default function Alerts() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCronString, setNewCronString] = useState("");
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editCronString, setEditCronString] = useState("");
  const [editText, setEditText] = useState("");
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

  function closeAddAlert() {
    setShowAdd(false);
    setNewCronString("");
    setNewText("");
  }

  async function addAlert(e) {
    e.preventDefault();
    try {
      let res = await axios.post("/add-alert", {
        cron_string: newCronString,
        text: newText,
      });
      if (res.data.status === "OK") {
        closeAddAlert();
        await loadAlerts();
      } else {
        window.alert(res.data.error);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function startEditing(alert) {
    setEditingId(alert.id);
    setEditCronString(alert.cron_string);
    setEditText(alert.text);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditCronString("");
    setEditText("");
  }

  async function saveAlert(e) {
    e.preventDefault();
    try {
      let res = await axios.post("/edit-alert", {
        id: editingId,
        cron_string: editCronString,
        text: editText,
      });
      if (res.data.status === "OK") {
        cancelEditing();
        await loadAlerts();
      } else {
        window.alert(res.data.error);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function removeAlert(alert) {
    if (!window.confirm(`${i18n("Delete")} "${alert.text}"?`)) return;
    try {
      let res = await axios.post("/delete-alert", {id: alert.id});
      if (res.data.status === "OK") {
        if (editingId === alert.id) cancelEditing();
        await loadAlerts();
      } else {
        window.alert(res.data.error);
      }
    } catch (e) {
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
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h1 className="mb-0">{i18n("Alerts")}</h1>
              <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
                {i18n("Add Alert")}
              </button>
            </div>
            {showAdd && (
              <form className="card card-body mb-3" onSubmit={addAlert}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label">{i18n("Cron Expression")}</label>
                    <input
                      className="form-control"
                      value={newCronString}
                      onChange={(e) => setNewCronString(e.target.value)}
                      placeholder="0 9 * * *"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">{i18n("Text")}</label>
                    <textarea
                      className="form-control"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows="1"
                      required
                    />
                  </div>
                  <div className="col-md-3 text-nowrap">
                    <button type="submit" className="btn btn-primary me-2">
                      {i18n("Save")}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={closeAddAlert}>
                      {i18n("Cancel")}
                    </button>
                  </div>
                </div>
              </form>
            )}
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>IDX</th>
                  <th>ID</th>
                  <th>{i18n("Next Run")}</th>
                  <th>{i18n("Cron Expression")}</th>
                  <th>{i18n("Text")}</th>
                  <th>{i18n("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, idx) => (
                  <tr key={a.id}>
                    <td>{idx}</td>
                    <td>{a.id}</td>
                    <td>{a.nextRun || ""}</td>
                    <td>
                      {editingId === a.id ? (
                        <input
                          className="form-control"
                          value={editCronString}
                          onChange={(e) => setEditCronString(e.target.value)}
                          form={`edit-alert-${a.id}`}
                          required
                        />
                      ) : a.cron_string}
                    </td>
                    <td>
                      {editingId === a.id ? (
                        <textarea
                          className="form-control"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          form={`edit-alert-${a.id}`}
                          required
                        />
                      ) : a.text}
                    </td>
                    <td className="text-nowrap">
                      {editingId === a.id ? (
                        <form id={`edit-alert-${a.id}`} onSubmit={saveAlert}>
                          <button type="submit" className="btn btn-primary btn-sm me-2">
                            {i18n("Save")}
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditing}>
                            {i18n("Cancel")}
                          </button>
                        </form>
                      ) : (
                        <>
                          <button type="button" className="btn btn-primary btn-sm me-2" onClick={() => startEditing(a)}>
                            {i18n("Edit")}
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAlert(a)}>
                            {i18n("Delete")}
                          </button>
                        </>
                      )}
                    </td>
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
