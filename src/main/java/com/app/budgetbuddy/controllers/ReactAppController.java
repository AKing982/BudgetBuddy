package com.app.budgetbuddy.controllers;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

//@Controller
//@Profile({"prod", "heroku"})
//public class ReactAppController
//{
////
////    // Special catch-all for React Router
////    @GetMapping(value = {"/",
////            "/register", "/dashboard", "/spending", "/summary",
////            "/payments", "/transactions", "/budgets", "/budget-test",
////            "/debt-overview", "/debt-progress", "/forgot-password"
////    })
////    public String reactRoutes() {
////        return "forward:/index.html";
////    }
////
////    // Health check endpoint
////    @GetMapping("/health")
////    @ResponseBody
////    public String health() {
////        return "OK";
////    }
////
////    @GetMapping("/api/test")
////    public String test() {
////        return "API working!";
////    }
//}
