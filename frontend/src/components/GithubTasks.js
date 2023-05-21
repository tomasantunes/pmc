import React, {useState, useEffect} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import $ from 'jquery';
import axios from 'axios';
import config from '../config';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Home() {
  const [githubTasks, setGithubTasks] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function loadGithubTasks() {
    setIsLoading(true);
    axios.get(config.BASE_URL + "/api/get-github-tasks")
    .then(function(response) {
      setIsLoading(false);
      if (response.data.status == "OK") {
        setGithubTasks(response.data.data);
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

  useEffect(() => {
    loadGithubTasks();
  }, []);
  return (
    <>
      <Sidebar />
      <div className="page">
        <h3>Github Tasks</h3>
        {isLoading &&
          <div style={{textAlign: "center"}}>
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        }
        <div dangerouslySetInnerHTML={{__html: githubTasks}}></div>
      </div>
    </>
  )
}
