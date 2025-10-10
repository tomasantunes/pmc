import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import config from '../config';

export default function Home() {
  const [githubRepos, setGithubRepos] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  function loadGithubTasks() {
    setIsLoading(true);
    axios.get(config.BASE_URL + "/api/get-github-tasks")
    .then(function(response) {
      setIsLoading(false);
      if (response.data.status == "OK") {
        setGithubRepos(response.data.data);
      }
      else {
        alert("Error loading Github Tasks");
      }
    })
    .catch(function(err) {
      setIsLoading(false);
      alert(err);
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
    loadGithubTasks();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <h2>Github Tasks</h2>
          {isLoading &&
            <div style={{textAlign: "center"}}>
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          }
          {Object.keys(githubRepos).length === 0 && !isLoading &&
            <div>No tasks found in your repositories.</div>
          }
          {Object.keys(githubRepos).map((repoName) => (
            <div key={repoName} style={{marginBottom: "20px"}}>
              <h4><a href={githubRepos[repoName].repo_url} target="_blank">{githubRepos[repoName].repo_name}</a></h4>
              <ul className="github-tasks-list">
                {githubRepos[repoName].tasks.map((task, index) => (
                  <li key={index}>
                    {task.url ? <a href={task.url} target="_blank">{task.title}</a> : task.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    )
  }
  else {
    return (<></>);
  }
}
