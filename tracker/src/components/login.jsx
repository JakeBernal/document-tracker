import React from 'react'

export default function sidebar() {
  return (
<div className="auth-container">
    <div className="auth-card">

      <div className="auth-tabs">
       <button className="active">Login</button>
       <button>Sign up</button>
      </div>

      <form className="auth-form">
      <h3>Login</h3>

       <input type="email" placeholder="Email" />
       <input type="password" placeholder="Password" />

       <button className="auth-btn">Login</button>
      </form>
    </div>
</div>
  )
}
