import React from 'react';
import Sidebar from './Sidebar';
import TasksPage from './TasksPage';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Home() {
  return (
    <>
      <Sidebar />
    </>
  )
}
