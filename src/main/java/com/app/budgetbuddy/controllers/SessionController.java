package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.User;
import com.app.budgetbuddy.services.SessionManagementService;
import com.app.budgetbuddy.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping(value="/api/session")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class SessionController
{
    private final SessionManagementService sessionManagementService;

    @Autowired
    public SessionController(SessionManagementService sessionManagementService)
    {
        this.sessionManagementService = sessionManagementService;
    }

    @GetMapping("/current-session")
    public ResponseEntity<?> getCurrentSession(HttpServletRequest request)
    {
        HttpSession session = request.getSession(false);
        if(session == null)
        {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No active session found"));
        }
        Map<String, Object> sessionInfo = Map.of(
                "sessionId", session.getId(),
                "userId", session.getAttribute("userId"),
                "username", session.getAttribute("username"),
                "roles", session.getAttribute("roles"),
                "creationTime", new Date(session.getCreationTime()),
                "lastAccessedTime", new Date(session.getLastAccessedTime()),
                "maxInactiveInterval", session.getMaxInactiveInterval(),
                "isNew", session.isNew()
        );
        return ResponseEntity.ok(sessionInfo);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createSession(@RequestBody Map<String, Object> sessionData,
                                           HttpServletRequest request)
    {
        // 1. Create the session (Spring Session Redis creates the cookie automatically)
        HttpSession session = request.getSession(true);

        // 2. Batch set attributes
        sessionData.forEach((key, value) -> {
            if (!key.equals("sessionId")) {
                session.setAttribute(key, value);
            }
        });

        // 3. Robustly handle the UserId linking
        Object userIdObj = sessionData.get("userId");
        if (userIdObj != null) {
            // Safe conversion from Integer/Long/String
            Long userId = Long.valueOf(userIdObj.toString());

            // Pass the ACTUAL session object to the service
            sessionManagementService.linkUserToSession(session, userId);
        }

        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "message", "Session created successfully"
        ));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateSession(@RequestBody Map<String, Object> updates,
                                           HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No active session to update"));
        }

        // Update session attributes
        updates.forEach((key, value) -> {
            if (!key.equals("sessionId")) { // Don't allow overriding session ID
                session.setAttribute(key, value);
            }
        });

        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "message", "Session updated successfully"
        ));
    }

    @GetMapping("/attribute/{key}")
    public ResponseEntity<?> getSessionAttribute(@PathVariable String key,
                                                 HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No active session"));
        }

        Object value = session.getAttribute(key);
        if (value == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Attribute not found"));
        }

        return ResponseEntity.ok(Map.of(
                "key", key,
                "value", value
        ));
    }

    @PostMapping("/attribute/{key}")
    public ResponseEntity<?> setSessionAttribute(@PathVariable String key,
                                                 @RequestBody Map<String, Object> body,
                                                 HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No active session"));
        }

        Object value = body.get("value");
        session.setAttribute(key, value);

        return ResponseEntity.ok(Map.of(
                "key", key,
                "value", value,
                "message", "Attribute set successfully"
        ));
    }

    @GetMapping("/user/{userId}/sessions")
    public ResponseEntity<?> getUserSessions(@PathVariable Long userId) {
        Set<String> sessions = sessionManagementService.getUserActiveSessions(userId);

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "activeSessions", sessions,
                "sessionCount", sessions.size()
        ));
    }

    @DeleteMapping("/invalidate")
    public ResponseEntity<?> invalidateCurrentSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        log.info("Received session: {}", session);
        if (session == null) {
            // Don't return 401 - just acknowledge there was no session to invalidate
            log.info("No Active session found");
            return ResponseEntity.ok(Map.of(
                    "message", "No active session found - already logged out"
            ));
        }

        String sessionId = session.getId();
        log.info("SessionId: {}", sessionId);
        session.invalidate();
        log.info("Session invalidated");

        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "message", "Session invalidated successfully"
        ));
    }

    @GetMapping("/all-attributes")
    public ResponseEntity<?> getAllSessionAttributes(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No active session"));
        }
        Map<String, Object> attributes = new HashMap<>();
        Enumeration<String> attributeNames = session.getAttributeNames();
        while (attributeNames.hasMoreElements()) {
            String name = attributeNames.nextElement();
            attributes.put(name, session.getAttribute(name));
        }
        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "attributes", attributes
        ));
    }


}
