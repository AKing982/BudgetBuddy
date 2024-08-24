import React from 'react';
import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route, Router, Routes} from "react-router-dom";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import LoginForm from "./components/LoginForm";
import RegistrationForm from "./components/RegistrationForm";
import DashboardPage from "./components/DashboardPage";

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // You can adjust this color to match your brand
        },
    },
});


function App() {
  return (
      <ThemeProvider theme={theme}>
          <BrowserRouter>
              <div className="App">
                  <Routes>
                      <Route path="/" element={<LoginForm/>}/>
                      <Route path="/register" element={<RegistrationForm />}/>
                      <Route path="/dashboard" element={<DashboardPage />}/>
                  </Routes>
              </div>
          </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
