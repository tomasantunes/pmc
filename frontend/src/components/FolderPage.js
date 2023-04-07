import React, {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TasksPage from './TasksPage';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function FolderPage() {
  var params = useParams();
  const id = params.id;
  
  return (
    <>
      <Sidebar />
      <TasksPage folder_id={id} />
    </>
  )
}
