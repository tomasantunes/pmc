import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';
import {i18n} from '../libs/translations';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function SignUp() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const navigate = useNavigate();

  function changeUser(event) {
    setUser(event.target.value);
  }

  function changePass(event) {
    setPass(event.target.value);
  }

  function requestSignUp(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/sign-up", {user, email, pass, confirmPass, licenseKey})
    .then(async res => {
      if (res.data.status == "OK") {
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

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.target.form.dispatchEvent(new Event("submit", {cancelable: true, bubbles: true}));
    }
  };

  return (
    <>
      <form 
        onSubmit={(e) => requestSignUp(e)} 
        autoComplete="on" 
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-4">
          <h1 className="fw-bold mb-0">PMC</h1>
          <small className="text-muted">{i18n("Productivity Management Center")}</small>
        </div>

        <h4 className="text-center mb-3">{i18n("Sign Up")}</h4>

        <div className="form-floating mb-3">
          <input
            type="text"
            id="username"
            name="username"
            value={user}
            onChange={changeUser}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder={i18n("Username")}
            required
          />
          <label htmlFor="username">{i18n("Username")}</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder={i18n("Email")}
            required
          />
          <label htmlFor="email">{i18n("Email")}</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="password"
            id="password"
            name="password"
            value={pass}
            onChange={changePass}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="password">{i18n("Password")}</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="password">{i18n("Confirm Password")}</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="text"
            id="license-key"
            name="license-key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="license-key">{i18n("License Key")}</label>
        </div>

        <button className="btn btn-primary w-100 py-2" type="submit">
          {i18n("Sign Up")}
        </button>
      </form>
    </>
  )
}
