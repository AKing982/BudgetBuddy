package com.example.userservice.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController(value="/api/users")
@CrossOrigin(value="http://localhost:3000")
public class UserController
{

}
