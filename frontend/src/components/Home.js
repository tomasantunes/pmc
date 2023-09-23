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
  const [motivationalText, setMotivationalText] = useState('');

  function getMotivationalText() {
    axios.get(config.BASE_URL + '/api/generate-motivational-text')
      .then(res => {
        setMotivationalText(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }

  useEffect(() => {
    getMotivationalText();
  });

  return (
    <>
      <Sidebar />
      <div className="page">
        <h3>Motivation</h3>
        <p>{motivationalText}</p>
        <Stats />
      </div>
    </>
  )
}
