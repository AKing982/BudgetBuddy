package com.app.budgetbuddy.services;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SessionManagementServiceTest
{

    @MockBean
    private UserLogService userLogService;

    @MockBean
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private SessionManagementService sessionManagementService;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}