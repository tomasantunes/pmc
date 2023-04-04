import React from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import $ from 'jquery';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Home() {
  return (
    <>
      <Sidebar />
      <div className="page">
        <Stats />
      </div>
    </>
  )
}
