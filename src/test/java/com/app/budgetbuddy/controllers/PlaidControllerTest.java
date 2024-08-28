package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.config.JpaConfig;
import com.app.budgetbuddy.domain.ExchangePublicTokenDTO;
import com.app.budgetbuddy.domain.PlaidLinkRequest;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.plaid.client.model.ItemPublicTokenExchangeResponse;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.devtools.autoconfigure.OptionalLiveReloadServer;
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

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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

    @MockBean
    private PlaidApi plaid;

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

    @MockBean
    private PlaidLinkService plaidLinkService;

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
    void testExchangePublicToken_whenExchangePublicTokenDTOIsNull_thenReturnBadRequest() throws Exception {
       String jsonString = objectMapper.writeValueAsString(null);
       mockMvc.perform(post("/api/plaid/exchange_public_token")
               .contentType(MediaType.APPLICATION_JSON)
               .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_whenExchangePublicTokenDTOIsNotNull_thenReturnOk() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();
        exchangePublicTokenMap.put(1L, "public_token");
        String jsonString = objectMapper.writeValueAsString(new ExchangePublicTokenDTO(exchangePublicTokenMap));
        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("access_token");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isOk());
    }

    @Test
    void testExchangePublicToken_whenExchangePublicTokeMapIsEmpty_thenReturnBadRequest() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();

        ExchangePublicTokenDTO exchangePublicTokenDTO = new ExchangePublicTokenDTO(exchangePublicTokenMap);
        String jsonString = objectMapper.writeValueAsString(exchangePublicTokenDTO);
        mockMvc.perform(post("/api/plaid/exchange_public_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_WhenValueNotFound_thenReturnBadRequest() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();
        exchangePublicTokenMap.put(1L, null);

        ExchangePublicTokenDTO exchangePublicTokenDTO = new ExchangePublicTokenDTO(exchangePublicTokenMap);

        String jsonString = objectMapper.writeValueAsString(exchangePublicTokenDTO);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testExchangePublicToken_whenAccessTokenEmpty_thenReturnNotFound() throws Exception {

        Map<Long, String> exchangePublicTokenMap = new HashMap<>();
        exchangePublicTokenMap.put(1L, "public_token");

        ExchangePublicTokenDTO exchangePublicTokenDTO = new ExchangePublicTokenDTO(exchangePublicTokenMap);

        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

        String jsonString = objectMapper.writeValueAsString(exchangePublicTokenDTO);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isNotFound());
    }

    @Test
    void testExchangePublicToken_whenMapIsValid_thenReturnOk() throws Exception {
        Map<Long, String> exchangePublicTokenMap = new HashMap<>();
        exchangePublicTokenMap.put(1L, "public_token");

        ExchangePublicTokenDTO exchangePublicTokenDTO = new ExchangePublicTokenDTO(exchangePublicTokenMap);

        ItemPublicTokenExchangeResponse itemPublicTokenExchangeResponse = new ItemPublicTokenExchangeResponse().accessToken("access_token");
        when(plaidLinkTokenProcessor.exchangePublicToken("public_token")).thenReturn(itemPublicTokenExchangeResponse);

        String jsonString = objectMapper.writeValueAsString(exchangePublicTokenDTO);

        mockMvc.perform(post("/api/plaid/exchange_public_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isOk());

    }

    @Test
    void testSaveAccessToken_whenPlaidLinkRequestIsNull_thenReturnBadRequest() throws Exception {

        String jsonString = objectMapper.writeValueAsString(null);
        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSaveAccessToken_whenAccessTokenIsNullOrEmpty_thenReturnBadRequest() throws Exception {
        PlaidLinkRequest plaidLinkRequest = new PlaidLinkRequest("", "3232323232", "1L");

        String jsonString = objectMapper.writeValueAsString(plaidLinkRequest);

        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }


    @Test
    void testSaveAccessToken_whenPlaidLinkRequestValid_thenReturnStatusCreated() throws Exception {
        PlaidLinkRequest plaidLinkRequest = new PlaidLinkRequest("e23232320", "chhsdfsdfasdf", "1");
        when(plaidLinkService.createPlaidLink(anyString(), anyString(), anyLong())).thenReturn(Optional.of(new PlaidLinkEntity()));

        String jsonString = objectMapper.writeValueAsString(plaidLinkRequest);

        mockMvc.perform(post("/api/plaid/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isCreated());
    }

    @Test
    void testCheckPlaidLinkStatus_whenUserIdIsValid_thenReturnOk() throws Exception {
        Long userId = 1L;

        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLink()));

        mockMvc.perform(get("/api/plaid/{userId}/plaid-link", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    private PlaidLinkEntity createPlaidLink(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setItemId("234234234234");
        plaidLinkEntity.setAccessToken("access_token");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
    }

    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setFirstName("firstName");
        userEntity.setLastName("lastName");
        userEntity.setEmail("email");
        userEntity.setPassword("password");
        userEntity.setId(1L);
        return userEntity;
    }


    @AfterEach
    void tearDown() {
    }
}