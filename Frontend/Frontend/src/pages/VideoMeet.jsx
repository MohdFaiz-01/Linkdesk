import { useEffect, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { io } from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { Badge, IconButton } from "@mui/material";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from "react-router-dom";
import RestoreIcon from '@mui/icons-material/Restore';
import server from "../environment";

const server_url = server;

var connections ={}

const peerConfigConnections = {
    "iceServers" : [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent () {

    var socketRef = useRef();      //Stores the active socket instance
    let socketIdRef = useRef();    //Stores the client’s own socket ID

    let localVideoRef = useRef();   //Refers our local videoRef <video/>

    let [videoAvailable, setVideoAvailable] = useState(true);     //for permission from user

    let [audioAvailable, setAudioAvailable] = useState(true);     //for permission from user

    let [video, setVideo] = useState([]);        //Tracks whether the local video is on

    let [audio, setAudio] = useState();          //Tracks whether the local audio is on

    let [screen, setScreen] = useState();        //Will refer to screen-sharing stream

    let [showModel, setModel] = useState(true);   //Meant for showing chat sidebar

    let [screenAvailable, setScreenAvailable] = useState();   //to check if screen sharing is supported by the browser

    let [messages, setMessages] = useState([]);    //array of all messages

    let [message, setMessage] = useState("");      //text of current input

    let [newMessages, setNewMessages] = useState(0);    //counter for unread messages

    let [askForUsername, setAskForUsername] = useState(true);  //When true, displays the "Enter username" screen before joining the call

    let [username, setUsername] = useState("");   //text of current input

    const videoRef = useRef([]);   //stores array of remote user videos (used for checking duplicates) (stores same as below ie obj of streams)

    let [videos, setVideos] = useState([]);   // list or array of all remote streams ({ socketId: "abc123", stream: MediaStream, autoPlay: true, playsinline: true})

    let [error, setError] = useState("");   //to store error and display later

    // if(isChrome() === false) {

    // }

    let routeTo = useNavigate();

    useEffect( () => {
        getPermissions();
    }, [])


    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
            if(videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});
            if(audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            // to see our brwoser has screenSharing feature or not
            if(navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable})

                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }


        } catch(err) {
            console.log(err);
        }
    }

    
    // const getPermissions = async () => {
    //     let videoAllowed = false;
    //     let audioAllowed = false;
    
    //     try {
    //         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    //         videoAllowed = true;
    //     } catch (e) {
    //         console.log("Video permission denied or error:", e);
    //     }
    
    //     try {
    //         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    //         audioAllowed = true;
    //     } catch (e) {
    //         console.log("Audio permission denied or error:", e);
    //     }
    
    //     // Update state AFTER checking
    //     setVideoAvailable(videoAllowed);
    //     setAudioAvailable(audioAllowed);
    
    //     // Check screen sharing support
    //     setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
    
    //     // If either permission is granted, get combined stream
    //     if (videoAllowed || audioAllowed) {
    //         try {
    //             const userMediaStream = await navigator.mediaDevices.getUserMedia({
    //                 video: videoAllowed,
    //                 audio: audioAllowed
    //             });
    
    //             window.localStream = userMediaStream;
    
    //             if (localVideoRef.current) {
    //                 localVideoRef.current.srcObject = userMediaStream;
    //             }
    //         } catch (e) {
    //             console.log("Failed to get combined media stream:", e);
    //         }
    //     }
    // };


    useEffect( () => {
        if(video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess)
            .then((stream) => {})
            .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop())

                // Create and send blackSilence stream
                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                let fallbackStream = blackSilence();
                getUserMediaSuccess(fallbackStream);
            }  catch (e) {
                console.log(e);
            }
        }
    }
    

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e)
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections) {
            if(id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false)

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e)
            }

            //TODO BlackSilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connections){
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                    }).catch(e => console.log(e))
                }).catch(e => console.log(e))
            }
        })
    }


    let connect = () => {
        try {
            if(username !== "" && username.length>3) {
                setAskForUsername(false);
                getMedia();
            } else {
                throw "* Enter valid username";
            }
            
        } catch(e) {
            setError(e);
        }
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false})

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if(event.candidate != null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice': event.candidate}));
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if(videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                )
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                            
                        } else {

                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if(window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        //TODO BlackSilence

                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }

                })

                //if i'm newly joined user then connect to all existing user's except me.
                if(id == socketIdRef.current) {
                    for(let id2 in connections) {
                        if(id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { 
                            console.log(e);
                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].localDescription}))
                            })
                            .catch((e) => console.log(e))
                        })
                    }
                }
            })
        })
    }
    

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if(fromId !== socketIdRef.current) {
            if(signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if(signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({'sdp': connections[fromId].localDescription}))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if(signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }



    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
    }

    let black = ({width= 640, height= 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false})
    }



    let addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            {sender: sender, data: data}
        ]);

        if(socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessagesNum) => prevMessagesNum + 1);
        }
    }


    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let handleScreen = () => {
        setScreen(!screen)
    }

    useEffect(() => {
        if(screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen])

    let getDisplayMedia = () => {
        if(screen) {
            if(navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
                .then(getDisplayMediaSuccess)
                .then((stream) => {})
                .catch((e) => console.log(e))
            }
        } else {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e)
            }

            //TODO BlackSilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        }
    }


    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e)
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections) {
            if(id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                .then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e)
            }

            //TODO BlackSilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            socketRef.current.disconnect();
        } catch (e) {
            console.log(e);
        }

        routeTo("/");
    }

    let navigate = useNavigate();

    return (
        <div>
            { askForUsername === true ? 
                <div>
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
                
                    <div className="lobbyContainer">
                        <div className="left-content">
                            <div>
                                <h2>Enter into Lobby</h2>
                                <div style={{display: "flex", gap: "10px", marginTop: "8px"}}>
                                    <TextField id="outlined-basic" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} variant="outlined" style={{backgroundColor: "white", borderRadius: "6px"}}/>
                                    <Button variant="contained" onClick={connect}>Connect</Button>
                                </div>
                                <p style={{color: "red"}}>{error}</p>
                            </div>
                        </div>

                        <div className="right-content">
                            <video ref={localVideoRef} autoPlay muted></video>
                        </div>

                    </div>
                </div> : 
                
                <div className={styles.meetVideoContainer}>

                    { showModel ? 
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length > 0 ? messages.map((item, index) => {
                                        return (
                                            <div style={{marginBottom: "20px"}} key={index}>
                                                <p style={{fontWeight: "bold", fontStyle: "italic", fontSize: "17px"}}>{item.sender}</p>
                                                <p>{item.data}</p>
                                            </div>
                                        )
                                    }) : <p>No Messages Yet</p>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter your chat" variant="outlined"/>
                                    <Button variant="contained" style={{height: "54px"}} onClick={sendMessage}>Send</Button>
                                </div>
                                
                            </div>
                        </div> : <></>
                    }

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{color: "white"}}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{color: "red"}}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{color: "white"}}>
                            {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{color: "white"}}>
                                {screen === true ? <ScreenShareIcon/> : <StopScreenShareIcon/>}
                            </IconButton> : <></>
                        }
                        <Badge badgeContent={newMessages} max={999} color="secondary">
                            <IconButton onClick={() => setModel(!showModel)} style={{color: "white"}}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        { videos.map((video) => (
                            <div key={video.socketId}>

                                <video 
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if(ref && video.stream) {
                                            ref.srcObject = video.stream
                                        }
                                    }}
                                    autoPlay
                                >
            
                                </video>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );

}