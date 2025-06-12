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
import TransactionsPage from "./components/TransactionsPage";
import BudgetPage from "./components/BudgetPage";
import BudgetCategoryDetails from './components/BudgetCategoryDetails';
import DebtOverview from "./components/DebtOverview";
import DebtPaymentProgress from './components/DebtPaymentProgress';
// import BudgetDebtPage from "./components/BudgetDebtPage";
import SpendingOverview from "./components/SpendingOverview";
import ForgotPassword from "./components/ForgotPassword";
import BudgetPlanner from "./components/BudgetPlanner";
import PBTemplate from "./components/PBTemplate";
// import BudgetControlPage from "./components/BudgetControlPage";
// import BudgetEmergencyFundPage from "./components/BudgetEmergencyFundPage";

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
                      {/*<Route path="/transactions" element={<RecentTransactionsTable />}/>*/}
                      <Route path="/summary" element={<AccountSummary />}/>
                      <Route path="/payments" element={<PaymentCharges />}/>
                      <Route path="/transactions" element={<TransactionsPage />}/>
                      <Route path="/budgets" element={<BudgetPage />}/>
                      <Route path="/budget-test" element={<BudgetCategoryDetails/>}/>
                      <Route path="/debt-overview" element={<DebtOverview />}/>
                      <Route path="/debt-progress" element={<DebtPaymentProgress />}/>
                      <Route path="/forgot-password" element={<ForgotPassword />}/>
                      <Route path="/budget-planner" element={<BudgetPlanner />}/>
                      <Route path="/pb-template" element={<PBTemplate />}/>
                      {/*<Route path="/budget-debt" element={<BudgetDebtPage />}/>*/}
                      {/*<Route path="/budget-spending" element={<BudgetControlPage />}/>*/}
                      {/*<Route path="/budget-emergency" element={<BudgetEmergencyFundPage />}/>*/}
                  </Routes>
              </div>
          </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
