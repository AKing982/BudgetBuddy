package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.services.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(value=UserController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@Testcontainers
class UserControllerTest {

    @Container
    static PostgreSQLContainer postgreSQLContainer = new PostgreSQLContainer("postgres:13.2")
            .withDatabaseName("testDB")
            .withUsername("root")
            .withPassword("root");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
    }


    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
    }

    @Test
    void testFindUserIdByUserNameWhenUserNameIsEmpty_thenReturnBadRequest() throws Exception {
        String username = "";

        mockMvc.perform(get("/api/users/username")
                .contentType(MediaType.APPLICATION_JSON)
                .param("username", username))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testFindUserIdByUsernameWhenUserNameMatchesEmailPattern_thenReturnStatusOk() throws Exception {
        String username = "test@test.com";

        mockMvc.perform(get("/api/users/username")
                .contentType(MediaType.APPLICATION_JSON)
                .param("username", username))
                .andExpect(status().isOk());
    }

    @Test
    void testFindUserIdByUsername_whenUserNameIsNotNull_thenReturnStatusOk() throws Exception {
        String username = "testUser";

        mockMvc.perform(get("/api/users/username")
                .contentType(MediaType.APPLICATION_JSON)
                .param("username", username))
                .andExpect(status().isOk());
    }

    @AfterEach
    void tearDown() {
    }
}