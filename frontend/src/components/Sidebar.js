import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from '../config';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');
var bootprompt = require('bootprompt');

export default function Sidebar() {
  const [folders, setFolders] = useState([]);

  function loadFolders() {
    setFolders([]);
    axios.get(config.BASE_URL + "/api/get-folders")
    .then(function(response) {
      if (response.data.status == "OK") {
        setFolders(response.data.data);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      alert(err.message);
    });
  }

  function submitAddFolder(name) {
    axios.post(config.BASE_URL + "/api/add-folder", {name: name})
    .then(function(response) {
      if (response.data.status == "OK") {
        loadFolders();
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
      alert(err.message);
    });
  }

  function openAddFolder() {
    bootprompt.prompt("Add Folder", (result) => {
      if (result == null) {
        return;
      }
      submitAddFolder(result);
    });
  }


  useEffect(() => {
    loadFolders();
  }, []);
  return (
    <div className="sidebar">
        <h1><b>PMC</b></h1>
        <ul className="menu">
            <li><a href="#" onClick={openAddFolder}>Add Folder</a></li>
            {folders.map((folder) => {
              return (
                <li key={folder.id}><a href={"/folder/" + folder.id}>{folder.name}</a></li>
              )
            })}
        </ul>
    </div>
  )
}
