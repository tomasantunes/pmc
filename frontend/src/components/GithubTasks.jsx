import React, {useState, useEffect} from 'react';
import Sidebar from './Sidebar';
import axios from 'axios';
import config from '../config';

export default function Home() {
  const [githubTasks, setGithubTasks] = useState('');
  const [githubIssues, setGithubIssues] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  function loadGithubIssues() {
    setLoadingIssues(true);
    axios.get(config.BASE_URL + "/api/get-github-issues")
    .then(function(response) {
      setLoadingIssues(false);
      if (response.data.status == "OK") {
        setGithubIssues(response.data.data);
      }
      else {
        alert("Error loading Github Issues");
      }
    })
    .catch(function(err) {
      setLoadingIssues(false);
      alert(err);
    });
  }

  function loadGithubTasks() {
    setLoadingTasks(true);
    axios.get(config.BASE_URL + "/api/get-github-tasks")
    .then(function(response) {
      setLoadingTasks(false);
      if (response.data.status == "OK") {
        setGithubTasks(response.data.data);
      }
      else {
        alert("Error loading Github Tasks");
      }
    })
    .catch(function(err) {
      setLoadingTasks(false);
      alert(err);
    });
  }

  useEffect(() => {
    setIsLoading(loadingIssues || loadingTasks);
  }, [loadingIssues, loadingTasks]);

  useEffect(() => {
    loadGithubIssues();
    loadGithubTasks();
  }, []);
  return (
    <>
      <Sidebar />
      <div className="page">
        {isLoading &&
          <div style={{textAlign: "center"}}>
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        }
        <h2>Github Issues</h2>
        <div dangerouslySetInnerHTML={{__html: githubIssues}}></div>
        <h2>Github Tasks</h2>
        <div dangerouslySetInnerHTML={{__html: githubTasks}}></div>
      </div>
    </>
  )
}
