//package com.app.budgetbuddy.services;
//
//import com.app.budgetbuddy.entities.UserEntity;
//import jakarta.servlet.http.HttpSession;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.session.FindByIndexNameSessionRepository;
//import org.springframework.session.Session;
//import org.springframework.stereotype.Service;
//
//import java.time.Duration;
//import java.time.LocalDate;
//import java.util.*;
//import java.util.stream.Collectors;
//
//@Service
//@Slf4j
//public class SessionManagementService
//{
//    private final FindByIndexNameSessionRepository<? extends Session> sessionRepository;
//
//    @Autowired
//    public SessionManagementService(FindByIndexNameSessionRepository<? extends Session> sessionRepository)
//    {
//        this.sessionRepository = sessionRepository;
//    }
//
//    /**
//     * Link User ID to the session.
//     * Note: If using Spring Security, this happens automatically.
//     */
//    public void linkUserToSession(HttpSession session, Long userId) {
//       String indexKey = FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME;
//
//        // Setting this attribute triggers RedisIndexedSessionRepository to create the index
//        session.setAttribute(indexKey, userId.toString());
//    }
//
//    /**
//     * Get all active sessions for a specific user.
//     */
//    public Set<String> getUserActiveSessions(Long userId) {
//        Map<String, ? extends Session> userSessions = sessionRepository.findByPrincipalName(userId.toString());
//        return userSessions.keySet();
//    }
//
//    /**
//     * Force logout a user from all devices.
//     */
//    public void invalidateUserSessions(Long userId) {
//        Map<String, ? extends Session> userSessions = sessionRepository.findByPrincipalName(userId.toString());
//        userSessions.keySet().forEach(sessionRepository::deleteById);
//        log.info("Invalidated {} sessions for user {}", userSessions.size(), userId);
//    }
//
//}
