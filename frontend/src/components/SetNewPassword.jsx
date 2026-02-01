import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {i18n} from '../libs/translations';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function SetNewPassword() {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resetPasswordToken = searchParams.get("token");
  const resetPasswordUserId = searchParams.get("id");

  function requestSetNewPassword(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/set-new-password", {resetPasswordToken, resetPasswordUserId, pass, confirmPass})
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
        onSubmit={(e) => requestSetNewPassword(e)} 
        autoComplete="on" 
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-4">
          <h4 className="fw-bold mb-0">{i18n("Set New Password")}</h4>
        </div>

        <div className="form-floating mb-3">
          <input
            type="password"
            id="password"
            name="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
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

        <button className="btn btn-primary w-100 py-2" type="submit">
          {i18n("Set New Password")}
        </button>
      </form>
    </>
  )
}
