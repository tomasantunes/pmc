import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import config from '../config.json';
import Sidebar from './Sidebar';
import axios from 'axios';

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  function loadSchedule() {
    axios.get(config.BASE_URL + "/api/get-schedule")
    .then((response) => {
      var data = response.data.data;
      let finalObj = {};
      data.forEach((item) => {
        const date = item.start_date.split(' ')[0]
        if (finalObj[date]) {
          finalObj[date].push(item);
        } else {
          finalObj[date] = [item];
        }
      })
      console.log(finalObj);
      setSchedule(finalObj);
    })
    .catch((error) => {
      console.log(error);
    });
  }

  function sortByDate(arr) {
    return arr.sort((a, b) => {
      return new Date(a) - new Date(b);
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
    loadSchedule();
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <Sidebar />
        <div className="page">
          <h2>Schedule</h2>
          <table className="table col-table">
            <thead>
              <tr>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
              </tr>
            </thead>
            <tbody>
                {sortByDate(Object.keys(schedule)).map((day, index) => {
                  return (
                    <tr>
                      {schedule[day].map((item, index) => {
                        return (
                          <td key={index}><div><b>{item.start_date.split(' ')[1].slice(0, 5)} - {item.end_date.split(' ')[1].slice(0, 5)}</b></div>{item.description}</td>
                        )
                      })}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </>
    )
  }
  else {
    return (<></>);
  }
}
