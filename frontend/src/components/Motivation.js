import React, {useState, useEffect} from 'react';
import Sidebar from './Sidebar';
import $ from 'jquery';
import axios from 'axios';
import config from '../config';

window.jQuery = $;
window.$ = $;
global.jQuery = $;
window.bootstrap = require('bootstrap');

export default function Motivation() {
  const [motivationalText, setMotivationalText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function getMotivationalText() {
    setIsLoading(true);
    axios.get(config.BASE_URL + '/api/generate-motivational-text')
      .then(response => {
        setIsLoading(false);
        setMotivationalText(response.data.data);
      })
      .catch(err => {
        setIsLoading(false);
        console.log(err);
      });
  }

  useEffect(() => {
    getMotivationalText();
  }, []);
  return (
    <>
      <Sidebar />
      <div className="page">
        <h3>Motivation</h3>
        {isLoading &&
          <div style={{textAlign: "center"}}>
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        }
        <div dangerouslySetInnerHTML={{__html: motivationalText}}></div>
      </div>
    </>
  )
}