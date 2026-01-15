import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* HERO */}
      <section className="bg-dark text-light py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">
            PMC – Productivity Management Center
          </h1>
          <p className="lead mb-4">
            One centralized system to organize your tasks, time, and schedule —
            designed for clarity, consistency, and long-term productivity.
          </p>

          <button
            className="btn btn-primary btn-lg px-4"
            onClick={() => window.location.href = 'mailto:general@paken.xyz'}
          >
            Get Access – 50€ / Year
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Everything you need to stay productive</h2>
            <p className="text-muted">
              PMC adapts to your workflow instead of forcing you into one.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                title: 'Tasks',
                text: 'Create, organize, and track tasks with clarity and focus.'
              },
              {
                title: 'Recurrent Tasks',
                text: 'Manage repeating work without mental overhead.'
              },
              {
                title: 'Monthly Tasks',
                text: 'Plan higher-level objectives and long-term commitments.'
              },
              {
                title: 'Daily To-Dos',
                text: 'Stay grounded with a clear daily execution list.'
              },
              {
                title: 'Schedule',
                text: 'Structure your time intentionally and avoid chaos.'
              },
              {
                title: 'Time Tracker',
                text: 'Understand where your time really goes.'
              },
              {
                title: 'Calendar',
                text: 'Visualize tasks, events, and workload in one place.'
              }
            ].map((feature, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title fw-semibold">
                      {feature.title}
                    </h5>
                    <p className="card-text text-muted">
                      {feature.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-light py-5">
        <div className="container text-center">
          <div className="d-inline-block bg-white p-4 rounded shadow-sm">
            <h3 className="fw-bold">50€ / Year</h3>
            <p className="text-muted mb-3">
              Full access to all current and future features.
            </p>
            <button
              className="btn btn-success btn-lg mb-5"
              onClick={() => window.location.href = 'mailto:general@paken.xyz'}
              style={{width: "350px"}}
            >
              Contact to Subscribe
            </button>
            <p className="text-muted mb-3">
              Already have an account?
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login')}
              style={{width: "350px"}}
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-4 bg-dark text-light">
        <div className="container text-center">
          <small style={{color: "white"}}>
            © {new Date().getFullYear()} Paken
            <br />
            Contact: general@paken.xyz
          </small>
        </div>
      </footer>
    </>
  )
}
