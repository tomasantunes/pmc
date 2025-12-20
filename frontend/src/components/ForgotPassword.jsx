import React, {useState} from 'react';
import axios from 'axios';
import config from '../config.json';
import {useNavigate} from 'react-router-dom';

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const MySwal = withReactContent(Swal)

export default function ForgotPassword() {
  const [emailUsername, setEmailUsername] = useState("");
  const navigate = useNavigate();

  function requestResetPassword(e) {
    e.preventDefault();
    axios.post(config.BASE_URL + "/api/reset-password", {emailUsername})
    .then(async res => {
      if (res.data.status == "OK") {
        MySwal.fire("A password reset link has been sent to the associated email address.")
        .then(function() {
          navigate("/login");
        });
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
        onSubmit={(e) => requestResetPassword(e)} 
        autoComplete="on" 
        className="card shadow-sm p-4 mx-auto mt-5"
        style={{ maxWidth: "420px" }}
      >
        <div className="text-center mb-4">
          <h4 className="fw-bold mb-0">Forgot Password</h4>
        </div>
        <div className="form-floating mb-3">
          <input
            type="text"
            id="email"
            name="email"
            value={emailUsername}
            onChange={(e) => setEmailUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control"
            required
          />
          <label htmlFor="email">Email/Username</label>
        </div>

        <button className="btn btn-primary w-100 py-2" type="submit">
          Reset Password
        </button>
      </form>
    </>
  )
}
