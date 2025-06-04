package com.app.budgetbuddy.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SessionManagementService
{
    private final RedisTemplate<String, String> redisTemplate;
    private static final String USER_SESSION_PREFIX = "user:sessions:";

    @Autowired
    public SessionManagementService(RedisTemplate<String, String> redisTemplate)
    {
        this.redisTemplate = redisTemplate;
    }

    public boolean isUserActive(Long userId)
    {
        Set<String> activeUserSessions = getUserActiveSessions(userId);
        return !activeUserSessions.isEmpty();
    }

    public void linkUserToSession(String sessionId, Long userID)
    {
        String userSessionKey = USER_SESSION_PREFIX + sessionId;
        redisTemplate.opsForSet().add(userSessionKey, sessionId);
        redisTemplate.expire(userSessionKey, Duration.ofMinutes(30));

        redisTemplate.opsForHash().put("spring:session:sessions:" + sessionId, sessionId, userID);
    }

    public Set<String> getAllActiveSessions()
    {
        return redisTemplate.opsForSet().members(USER_SESSION_PREFIX);
    }

    public Set<Long> getActiveUsersBySessions()
    {
        Set<String> sessions = getAllActiveSessions();
        Set<Long> userIds = new HashSet<>();
        try
        {
            for(String sessionId : sessions)
            {
                if(sessionId != null && sessionId.startsWith(USER_SESSION_PREFIX))
                {
                    String userIDAsString = sessionId.substring(USER_SESSION_PREFIX.length());
                    Long userID = Long.parseLong(userIDAsString);
                    userIds.add(userID);
                }
            }
            return userIds;
        }catch(NumberFormatException e){
            log.error("There was an error retrieving the active users by sessions: ", e);
            return Collections.emptySet();
        }
    }

    // Get all active sessions for a user
    public Set<String> getUserActiveSessions(Long userId) {
        String userSessionKey = USER_SESSION_PREFIX + userId;
        return Objects.requireNonNull(redisTemplate.opsForSet().members(userSessionKey))
                .stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    // Invalidate all sessions for a user
    public void invalidateUserSessions(Long userId) {
        Set<String> sessions = getUserActiveSessions(userId);
        sessions.forEach(sessionId -> {
            redisTemplate.delete("budgetbuddy:session:sessions:" + sessionId);
            redisTemplate.delete("budgetbuddy:session:sessions:expires:" + sessionId);
        });
        redisTemplate.delete(USER_SESSION_PREFIX + userId);
    }

}
