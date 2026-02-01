import React, {useEffect, useState} from 'react';
import Chart from "react-apexcharts";
import axios from 'axios';
import config from '../config';
import {i18n} from '../libs/translations';

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
      <div style={{width: "90%", margin: "0 auto"}}>
        <h2>{i18n("User Info")}</h2>
        <p><b>{i18n("Username")}:</b> {username}</p>
        <p><b>{i18n("Email")}:</b> {email}</p>
        <p><b>{i18n("Registration Date")}:</b> {registrationDate}</p>
        <p><b>{i18n("License Expiration Date")}:</b> {licenseExpirationDate}</p>
      </div>
    </>
  )
}
