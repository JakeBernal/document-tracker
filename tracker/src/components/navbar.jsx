
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

export default function navbar() {
  return (
  <nav className="navbar">
    <div className="logo">
     <img className="img" src={'logo.png'} alt="Logo" />
     PaperTrail<br></br>
     Digital Solutions
   </div>
   <div className="nav-txt">
    <ul>
     <li>Home</li>
     <li>Services</li>
     <li>About</li>
     <li>Contact</li>
    </ul>
   </div>
  <div className="nav-actions">
    <button className="userbtn">Sign in</button>
  </div>
</nav>
  )
}
