import { useContext, useEffect, useState } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { IconButton } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';

export default function History () {
    const { getHistoryOfUser, deleteHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);

    const routeTo = useNavigate();

    const fetchHistory = async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history);
        } catch {
            // implement SnakBar
        }
    }

    useEffect(()=> {
        fetchHistory();
    }, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`
    }

    let deleteHistory = async (id) => {
        try {
            const deletedActivity = await deleteHistoryOfUser(id);
            console.log(deletedActivity);
            fetchHistory();
        } catch(e) {
            console.log(e);
        }
    }

    return (
        <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginInline: "20px"}}>
                <h2>Meetings History</h2>
                <IconButton onClick={() => {
                    routeTo("/home")
                }}>
                    Home<HomeIcon />
                </IconButton>
            </div>
            { meetings.length !== 0 ? meetings.map( (ele, idx) => {
                return (
                    <div key={idx}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                    Meeting Code: {ele.meetingCode}
                                </Typography>
                                
                                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    Joined-date: {formatDate(ele.date)}
                                </Typography>
                                
                                <Button variant="contained" onClick={() => {
                                    deleteHistory(ele._id)
                                }}>
                                    Delete
                                </Button>
                            </CardContent>
                            
                        </Card>
                    </div>
                )
            }) : <></>}
        </div>
    );
}