import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {
    const router = useNavigate();
    const startBtn = () => {
        if(localStorage.getItem("token")) {
            router("/home");
        } else {
            router("/auth");
        }
    } 

    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Linkdesk <img src="/cropwenlogo.png" alt="logo" style={{backgroundColor: "white", borderRadius: "41px",height: "22px"}} /></h2>
                </div>
                <div className="navlist">
                    <p id="join" onClick={() => {
                        router("/guest1212");
                    }}>Join as Guest</p>
                    {localStorage.getItem("token") ? <></> : <p id="register" onClick={() => {router("/auth")}}>Register</p>}
                    <div role="button">
                        { localStorage.getItem("token") ? 
                            <p id="login" onClick={() => { localStorage.removeItem("token"); router("/") }}>Logout</p> : 
                            <p id="login" onClick={() => { router("/auth") }} >Login</p>
                        }
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color: "#FF9839"}}>Connect</span> with your loved ones</h1>
                    <p>Cover a distance by Linkdesk .</p>
                    <div role="button" onClick={() => startBtn()}>
                        <Link >Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>
        </div>
    );
}