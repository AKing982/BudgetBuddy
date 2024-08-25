import React from 'react';
import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route, Router, Routes} from "react-router-dom";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import LoginForm from "./components/LoginForm";
import RegistrationForm from "./components/RegistrationForm";
import DashboardPage from "./components/DashboardPage";
import SpendingTracker from "./components/SpendingTracker";
import RecentTransactionsTable from "./components/RecentTransactionsTable";
import AccountSummary from "./components/AccountSummary";
import PaymentCharges from "./components/PaymentCharges";

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
                      <Route path="/spending" element={<SpendingTracker />}/>
                      <Route path="/transactions" element={<RecentTransactionsTable />}/>
                      <Route path="/summary" element={<AccountSummary />}/>
                      <Route path="/payments" element={<PaymentCharges />}/>
                  </Routes>
              </div>
          </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
