import React, {useEffect, useState} from 'react';
import Tasks from './Tasks';
import $ from 'jquery';
import axios from 'axios';
import config from '../config';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function TasksPage({folder_id}) {
  const [folder, setFolder] = useState({});

  function getFolderInfo(folder_id) {
    axios.get(config.BASE_URL + "/api/get-folder", {
      params: {
        folder_id: folder_id
      }
    })
    .then(function(response) {
      if (response.data.status === "OK") {
        setFolder(response.data.data);
      }
    })
    .catch(function(err) {
      console.log(err);
      alert("Error: " + err.message);
    });

  }

  useEffect(() => {
    getFolderInfo(folder_id);
  }, []);
  return (
    <div className="page">
        <div style={{textAlign: "center"}}>
            <h3>{folder.name}</h3>
        </div>
        <Tasks folder_id={folder_id} />
    </div>
  )
}
