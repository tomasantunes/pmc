import React from 'react';
import Tasks from './Tasks';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function TasksPage({folder_id}) {
  return (
    <div className="page">
        <div style={{textAlign: "center"}}>
            <h3>Tasks</h3>
        </div>
        <Tasks folder_id={folder_id} />
    </div>
  )
}
