package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins="http://localhost:3000")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/username")
    public ResponseEntity<?> findUserIdByUserName(@RequestParam String username){
        if(username.isEmpty()){
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }
        Pattern emailPattern = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");
        Matcher matcher = emailPattern.matcher(username);
        Long userId = null;
        if(matcher.matches()){
            userId = userService.findUserIdByEmail(username);
        }else{
            userId = userService.findUserIdByUsername(username);
        }
        return ResponseEntity.status(200).body(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> findUserById(@PathVariable Long id){
        return ResponseEntity.badRequest().build();
    }
}
