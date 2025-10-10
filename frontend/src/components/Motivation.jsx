import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import config from '../config';

export default function Motivation() {
  const [motivationalText, setMotivationalText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

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

  function checkLogin() {
    axios.post(config.BASE_URL + "/check-login")
    .then(response => {
      if (response.data.status === "OK") {
        setIsLoggedIn(true);
      }
      else {
        navigate('/login');
      }
    })
    .catch(error => {
      navigate('/login');
    });
  }

  useEffect(() => {
    checkLogin();
    getMotivationalText();
  }, []);

  if (isLoggedIn) {
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
  else {
    return (<></>);
  }
}