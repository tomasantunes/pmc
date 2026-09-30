import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';
import {i18n, getCurrentLanguage} from '../libs/translations'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

var user_manual_link = getCurrentLanguage() == "en-us" ? "/static/pmc-user-manual.pdf" : "/static/pmc-user-manual-pt.pdf";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  function changeUser(event) {
    setUser(event.target.value);
  }

  function changePass(event) {
    setPass(event.target.value);
  }

  function requestLogin() {
    axios.post(config.BASE_URL + "/api/check-login", {user, pass})
    .then(async res => {
      if (res.data.status == "OK") {
        if ("credentials" in navigator && typeof PasswordCredential !== "undefined") {
          const cred = new PasswordCredential({
            id: user,
            password: pass,
          });
          await navigator.credentials.store(cred);
        }
        navigate("/home");
      }
      else {
        MySwal.fire(res.data.error);
      }
    })
    .catch(err => {
      MySwal.fire(err.message);
    });
  }

  return (
    <>
      <div
        autoComplete="on"
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0">PMC</h1>
          <small className="text-muted">{i18n("Productivity Management Center")}</small>
        </div>

        <h4 className="text-center mb-3">{i18n("Login")}</h4>

        {/* Username */}
        <div className="form-floating mb-3">
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            value={user}
            onChange={changeUser}
            className="form-control"
            placeholder={i18n("Username")}
            required
          />
          <label htmlFor="username">{i18n("Username")}</label>
        </div>

        {/* Password */}
        <div className="form-floating mb-4">
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={pass}
            onChange={changePass}
            className="form-control"
            placeholder={i18n("Password")}
            required
          />
          <label htmlFor="password">{i18n("Password")}</label>
        </div>

        {/* Submit */}
        <button className="btn btn-primary w-100 py-2" type="button" onClick={requestLogin}>
          {i18n("Login")}
        </button>

        {/* Links */}
        <div className="text-center mt-4">
          <a href="/sign-up" className="text-muted d-block mb-1">
            {i18n("Don't have an account? Sign up")}
          </a>
          <a href="/forgot-password" className="text-muted d-block mb-1">
            {i18n("Forgot your password?")}
          </a>
          <a href={user_manual_link} className="text-muted d-block mb-1" target="_blank" rel="noopener noreferrer">
            {i18n("User Manual")}
          </a>
        </div>
      </div>

    </>
  )
}
