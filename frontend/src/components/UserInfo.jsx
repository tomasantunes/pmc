import React, {useEffect, useState} from 'react';
import Chart from "react-apexcharts";
import axios from 'axios';
import config from '../config';

export default function UserInfo() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [licenseExpirationDate, setLicenseExpirationDate] = useState("");

  function loadUserInfo() {
    axios.get(config.BASE_URL + "/api/get-user-info")
    .then(function(response) {
      if (response.data.status == "OK") {
        setUsername(response.data.data.username);
        setEmail(response.data.data.email);
        setRegistrationDate(response.data.data.registration_date);
        setLicenseExpirationDate(response.data.data.license_expiration_date);
      }
      else {
        alert(response.data.error);
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  }

  useEffect(() => {
    loadUserInfo();
  }, []);
  return (
    <>
      <h2>User Info</h2>
      <p><b>Username:</b> {username}</p>
      <p><b>Email:</b> {email}</p>
      <p><b>Registration Date:</b> {registrationDate}</p>
      <p><b>License Expiration Date:</b> {licenseExpirationDate}</p>
    </>
  )
}
