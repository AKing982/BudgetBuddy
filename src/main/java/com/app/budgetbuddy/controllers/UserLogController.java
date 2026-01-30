package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.UserLogRequest;
import com.app.budgetbuddy.entities.UserLogEntity;
import com.app.budgetbuddy.services.UserLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(value="http://localhost:3000")
@RequestMapping(value="/api/userLog")
@RestController
@Slf4j
public class UserLogController
{
    private final UserLogService userLogService;

    @Autowired
    public UserLogController(UserLogService userLogService)
    {
        this.userLogService = userLogService;
    }

    @PostMapping("/save")
    public ResponseEntity<UserLogEntity> saveUserLog(@RequestBody UserLogRequest userLogRequest)
    {
        try
        {
            if(userLogRequest == null)
            {
                return ResponseEntity.badRequest().build();
            }
            Optional<UserLogEntity> userLogEntity = userLogService.saveUserLogRequest(userLogRequest);
            return userLogEntity.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        }catch(Exception e){
            log.error("There was an error while saving user log", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserLogEntity> getUserLogEntityById(@PathVariable Long id)
    {
        try
        {
            if(id < 1L)
            {
                return ResponseEntity.badRequest().build();
            }
            Optional<UserLogEntity> userLogEntity = userLogService.findById(id);
            return userLogEntity.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        }catch(Exception e){
            log.error("There was an error while getting user log", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/active/{userId}")
    public ResponseEntity<UserLogEntity> getActiveUserLogByUserId(@PathVariable Long userId)
    {
        try
        {
            Optional<UserLogEntity> activeUserLog = userLogService.getActiveUserLogByUserId(userId);
            return activeUserLog.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        }catch(Exception e){
            log.error("There was an error while getting active user log", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateUserLog(@PathVariable Long id, @RequestBody UserLogRequest userLogRequest)
    {
        try
        {
            if (id < 1L || userLogRequest == null)
            {
                return ResponseEntity.badRequest().build();
            }
            log.info("Updating user log entity with id " + id);
            userLogService.updateUserLog(id, userLogRequest);
            return ResponseEntity.ok("User log updated successfully");

        }catch(Exception e){
            log.error("There was an error while updating user log", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
