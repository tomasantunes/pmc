import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import AutoComplete from "./AutoComplete";
import axios from "axios";
import config from "../config";

export default function TimeTracker() {
  const [description, setDescription] = useState("");
  const [sessions, setSessions] = useState([]);
  const [closedSessions, setClosedSessions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [showCurrentSessions, setShowCurrentSessions] = useState(true);
  const [showClosedSessions, setShowClosedSessions] = useState(false);
  const navigate = useNavigate();

  // ================================
  // API CALLS
  // ================================

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${config.BASE_URL}/api/time-tracker/list`);
      if (res.data.status === "OK") {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchClosedSessions = async () => {
    try {
      const res = await axios.get(`${config.BASE_URL}/api/time-tracker/list-closed`);
      if (res.data.status === "OK") {
        setClosedSessions(res.data.sessions);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const startSession = async () => {
    if (!description.trim()) return;
    try {
      await axios.post(`${config.BASE_URL}/api/time-tracker/start`, {
        description,
      });
      setDescription("");
      fetchSessions();
    } catch (err) {
      console.error("Error starting session:", err);
    }
  };

  const pauseSession = async (id) => {
    try {
      await axios.post(`${config.BASE_URL}/api/time-tracker/${id}/pause`);
      fetchSessions();
    } catch (err) {
      console.error("Error pausing session:", err);
    }
  };

  const resumeSession = async (id) => {
    try {
      await axios.post(`${config.BASE_URL}/api/time-tracker/${id}/resume`);
      fetchSessions();
    } catch (err) {
      console.error("Error resuming session:", err);
    }
  };

  const stopSession = async (id) => {
    try {
      await axios.post(`${config.BASE_URL}/api/time-tracker/${id}/stop`);
      fetchSessions();
    } catch (err) {
      console.error("Error stopping session:", err);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.post(`${config.BASE_URL}/api/time-tracker/${id}/delete`);
      fetchSessions();
      fetchClosedSessions();
    } catch (err) {
      console.error("Error stopping session:", err);
    }
  };

  const getSuggestionsList = async () => {
    try {
      const res = await axios.get(
        `${config.BASE_URL}/api/time-tracker/get-autocomplete`,
      );
      if (res.data.status === "OK") {
        setSuggestionsList(res.data.data.map((s) => s.description));
      }
    } catch (err) {
      console.error("Error getting suggestions list:", err);
    }
  };

  // ================================
  // HELPERS
  // ================================

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  function checkLogin() {
    axios
      .post(config.BASE_URL + "/check-login")
      .then((response) => {
        if (response.data.status === "OK") {
          setIsLoggedIn(true);
        } else {
          navigate("/login");
        }
      })
      .catch((error) => {
        navigate("/login");
      });
  }

  function tabCurrentSessions() {
    setShowCurrentSessions(true);
    setShowClosedSessions(false);
  }

  function tabClosedSessions() {
    setShowClosedSessions(true);
    setShowCurrentSessions(false);
  }

  function shareToX() {
    let message = "I am currently: ";

    for (let i in sessions) {
      message += sessions[i].description;
      if (i < sessions.length - 1) {
        message += " and ";
      }
      else {
        message += ".";
      }
    }
    window.open("https://twitter.com/intent/tweet?text=" + message, "_blank");
  }

  // Periodically refresh timers
  useEffect(() => {
    checkLogin();
    fetchSessions();
    fetchClosedSessions();
    getSuggestionsList();
    const timer = setInterval(fetchSessions, 1000);
    return () => clearInterval(timer);
  }, []);

  // ================================
  // RENDER
  // ================================
  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <div className="container py-5">
            <h2 className="mb-4 text-center">
              <i className="fas fa-clock me-2"></i>Time Tracker
            </h2>

            <div className="row mb-4">
              <div className="col-md-4"></div>
              <div className="col-md-4">
                <AutoComplete
                  suggestionsList={suggestionsList}
                  inputValue={description}
                  setInputValue={setDescription}
                />
                <br />
                <div className="text-end">
                  <button
                    className="btn btn-primary ms-1 me-2"
                    onClick={startSession}
                  >
                    <i className="fas fa-play me-1"></i> Start
                  </button>
                  <button className="btn bg-black text-white" onClick={shareToX}>
                    <i class="fa-brands fa-x-twitter me-1"></i>
                    Share
                  </button>
                </div>
              </div>
            </div>

            <ul class="nav nav-tabs">
              <li class="nav-item">
                <a class="nav-link" href="#" onClick={tabCurrentSessions}>Current</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" onClick={tabClosedSessions}>Closed</a>
              </li>
            </ul>

            {showCurrentSessions &&
              <div className="list-group">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="me-3 flex-grow-1">
                      <h6 className="mb-1">{s.description}</h6>
                      <small className="text-muted">
                        {formatDuration(s.total_seconds)}
                      </small>
                    </div>
                    <div>
                      {s.end_time ? (
                        <button
                          key={Math.random()}
                          className="btn btn-sm btn-secondary me-2"
                          disabled
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      ) : s.is_running ? (
                        <>
                          <button
                            key={Math.random()}
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => pauseSession(s.id)}
                          >
                            <i className="fas fa-pause"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2"
                            onClick={() => stopSession(s.id)}
                          >
                            <i className="fas fa-stop"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            key={Math.random()}
                            className="btn btn-sm btn-success me-2"
                            onClick={() => resumeSession(s.id)}
                          >
                            <i className="fas fa-play"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2"
                            onClick={() => stopSession(s.id)}
                          >
                            <i className="fas fa-stop"></i>
                          </button>

                        </>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteSession(s.id)}
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No sessions yet.
                  </div>
                )}
              </div>
            }

            {showClosedSessions &&
              <div className="list-group">
                {closedSessions.map((s) => (
                  <div
                    key={s.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="me-3 flex-grow-1">
                      <h6 className="mb-1">{s.description}</h6>
                      <small className="text-muted">
                        {formatDuration(s.total_seconds)}
                      </small>
                    </div>
                    <div>
                      {s.end_time ? (
                        <button
                          key={Math.random()}
                          className="btn btn-sm btn-secondary me-2"
                          disabled
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      ) : s.is_running ? (
                        <>
                          <button
                            key={Math.random()}
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => pauseSession(s.id)}
                          >
                            <i className="fas fa-pause"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2"
                            onClick={() => stopSession(s.id)}
                          >
                            <i className="fas fa-stop"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            key={Math.random()}
                            className="btn btn-sm btn-success me-2"
                            onClick={() => resumeSession(s.id)}
                          >
                            <i className="fas fa-play"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2"
                            onClick={() => stopSession(s.id)}
                          >
                            <i className="fas fa-stop"></i>
                          </button>

                        </>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteSession(s.id)}
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No sessions yet.
                  </div>
                )}
              </div>
            }
          </div>
        </div>
      </>
    );
  } else {
    return <></>;
  }
}
