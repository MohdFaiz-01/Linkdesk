import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';


// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();

    const [formState, setFormState] = React.useState(0);

    const[open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
      try {
        if(formState === 0) {
          let result = await handleLogin(username, password);
          console.log(result);
        }

        if(formState === 1) {
          let result = await handleRegister(name, username, password);
          console.log(result);
          setMessage(result);
          setOpen(true);
          setError("");
          setFormState(0);
          setUsername("");
          setPassword("");
        }
      } catch (err) {
        let message = (err.response.data.message);
        setError(message);
      }
    }

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }} style={{background: 'URL("/login.jpg")', backgroundSize: "cover", backgroundRepeat: "no-repeat"}}>
        <CssBaseline />
        <div style={{display: "flex", alignItems: "center", position: "absolute", right: "30vw", top: "45vh"}}>
          <a href="/" style={{fontSize: "25px", textDecoration: "none", color:"white", fontWeight:"bold"}}><h2>Linkdesk <img src="/cropwenlogo.png" alt="logo" style={{backgroundColor: "white", borderRadius: "41px",height: "22px"}} /></h2></a>
        </div>
        
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>

            <div>
                <Button variant={formState === 0 ? "contained" : ""} onClick={() => {setFormState(0)}}>Sign In</Button>
                <Button variant={formState === 1 ? "contained" : ""} onClick={() => {setFormState(1)}}>Sign Up</Button>
            </div>

            <Box component="form" noValidate sx={{ mt: 1 }}>
              {formState === 1 ? 
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullname"
                label="Full Name"
                name="fullname"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              /> : <></>}
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <p style={{color: "red"}}>{error}</p>

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "LogIn" : "Register"}
              </Button>
              
              { formState === 0 ? <Typography>Didn't have an account? <Button onClick={() => {setFormState(1); setUsername(""); setName(""); setPassword(""); setError("")}}>Signup</Button> </Typography> : 
              <Typography>Already have an account? <Button onClick={() => {setFormState(0); setUsername(""); setPassword(""); setError("")}}>Login</Button></Typography>
              }
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar 
        open = {open}
        autoHideDuration = {4000}
        message = {message}
      />
    </ThemeProvider>
  );
}