package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{userId}/email")
    public ResponseEntity<String> getEmailById(@PathVariable Long userId)
    {
        Optional<UserEntity> userEntityOptional = userService.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        UserEntity userEntity = userEntityOptional.get();
        String email = userEntity.getEmail();
        return ResponseEntity.ok().body(email);
    }

    @GetMapping("{userId}/name")
    public ResponseEntity<String> findFirstAndLastName(@PathVariable Long userId) {
        Optional<UserEntity> userEntityOptional = userService.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        UserEntity userEntity = userEntityOptional.get();
        String firstName = userEntity.getFirstName();
        String lastName = userEntity.getLastName();
        String name = firstName + " " + lastName;
        return ResponseEntity.ok().body(name);
    }

    @GetMapping("/{userId}/find-name")
    public ResponseEntity<String> findUserNameById(@PathVariable Long userId) {
        Optional<UserEntity> userEntityOptional = userService.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        UserEntity userEntity = userEntityOptional.get();
        String userName = userEntity.getUsername();
        log.info("Retrieved username {}", userName);
        return ResponseEntity.ok(userName);
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

    @GetMapping("/max-id")
    public ResponseEntity<Long> findMaxId(){
        try
        {
            Long maxUserId = userService.findMaxUserId();
            return ResponseEntity.ok(maxUserId);
        }catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
