package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.config.JpaConfig;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.junit.jupiter.api.Assertions.*;


@WebMvcTest(value=PlaidController.class, excludeAutoConfiguration= SecurityAutoConfiguration.class)
@Testcontainers
class PlaidControllerTest {

    @Container
    static PostgreSQLContainer<?> postgreSQLContainer = new PostgreSQLContainer<>("postgres:13.2")
            .withDatabaseName("buddy")
            .withUsername("buddy")
            .withPassword("buddy");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
    }

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateLinkTokenWithEmptyUserId_thenReturnBadRequest() throws Exception {

        String jsonString = objectMapper.writeValueAsString("");
        mockMvc.perform(post("/api/plaid/create_link_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateLinkTokenWithValidUserId_thenReturnCreated() throws Exception {

        LinkTokenCreateResponse linkTokenCreateResponse = new LinkTokenCreateResponse().linkToken("e2e2e2");
        when(plaidLinkTokenProcessor.createLinkToken("1")).thenReturn(linkTokenCreateResponse);

        mockMvc.perform(post("/api/plaid/create_link_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("1"))
                .andExpect(status().isCreated());
    }

    @Test
    void testExchangePublicToken_whenPublicTokenIsEmpty_thenReturnBadRequest() throws Exception {

    }


    @AfterEach
    void tearDown() {
    }
}