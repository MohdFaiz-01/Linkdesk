import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from "../contexts/AuthContext";

function Home() {
    let navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");

    const {addToUserHistory} = useContext(AuthContext)

    let handleJoinVideoCall = async () => {
        try {
            if(meetingCode !== "" && meetingCode.length > 3) {
                await addToUserHistory(meetingCode)
                navigate(`/${meetingCode}`)
            } else {
                throw "* Please enter valid meeting code";
            }
            
        } catch (e) {
            setError(e);
        }
        
    }
    return (
        <>
            <div className="navBar">

                <div style={{display: "flex", alignItems: "center"}}>
                    <a href="/" style={{fontSize: "25px", textDecoration: "none", color:"black", fontWeight:"bold"}}><h2>Linkdesk <img src="/cropwenlogo.png" alt="logo" style={{backgroundColor: "white", borderRadius: "41px",height: "22px"}} /></h2></a>
                </div>

                <div style={{display: "flex", alignItems: "center"}}>
                    <IconButton onClick={() => {
                        navigate("/history");
                    }}>
                        <RestoreIcon />
                        <p style={{fontSize: "15px", marginRight: "20px"}}>History</p>
                    </IconButton>
                    
                    <Button variant="contained" onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/")
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>A single connection, unlimited conversation.</h2>
                        <div style={{display: "flex", gap: "10px", marginTop: "8px"}}>
                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" style={{backgroundColor: "white", borderRadius: "6px"}}/>
                            <Button onClick={handleJoinVideoCall} variant="contained">Join</Button>                            
                        </div>
                        <p style={{color: "red"}}>{error}</p>
                    </div>
                </div>

                <div className="rightPanel">
                    <img srcSet="/logo3.png" alt="home-img" />
                </div>
            </div>
        </>
    );
}


export default withAuth(Home)