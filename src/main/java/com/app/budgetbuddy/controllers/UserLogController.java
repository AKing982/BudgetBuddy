package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.services.UserLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(value="http://localhost:3000")
@RequestMapping(value="/api/userLog")
@RestController
public class UserLogController
{
    private final UserLogService userLogService;

    @Autowired
    public UserLogController(UserLogService userLogService)
    {
        this.userLogService = userLogService;
    }

    @PostMapping("/")
}
