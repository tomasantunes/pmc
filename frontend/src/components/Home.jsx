import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import Sidebar from './Sidebar';
import Stats from './Stats';
import axios from 'axios';
import config from '../config.json';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <Stats />
        </div>
      </>
    );
  } 
  else {
    return (<></>);
  }
}
