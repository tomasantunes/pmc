import React from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import TasksPage from './TasksPage';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function FolderPage() {
  const id = useParams().id;

  console.log(id);
  return (
    <>
      <Sidebar />
      <TasksPage folder_id={id} />
    </>
  )
}
