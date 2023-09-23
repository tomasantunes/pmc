import React, {useEffect, useState} from 'react';
import Sidebar from './Sidebar';
import Stats from './Stats';
import $ from 'jquery';
import axios from 'axios';
import config from '../config.json';

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
