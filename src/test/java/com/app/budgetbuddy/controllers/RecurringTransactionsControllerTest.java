package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AmountDTO;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionRequest;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@WebMvcTest(value=RecurringTransactionsController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@Testcontainers
class RecurringTransactionsControllerTest {

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
    private RecurringTransactionService recurringTransactionService;

    @MockBean
    private PlaidTransactionManager plaidTransactionManager;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void testGetAllRecurringTransactionsByUserId_whenUserIdIsInvalid() throws Exception {
        final Long userId = -1L;

        mockMvc.perform(get("/api/recurring-transactions/users/{userId}/recurring", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllRecurringTransactionsByUserId_whenUserIdIsValid() throws Exception {
        final Long userId = 1L;

        List<RecurringTransactionEntity> expected = new ArrayList<>();
        expected.add(createRecurringTransactionEntity());

        Mockito.when(recurringTransactionService.findAllByUserId(userId)).thenReturn(expected);

        mockMvc.perform(get("/api/recurring-transactions/users/{userId}/recurring", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void testAddRecurringTransaction_whenRequestBodyIsInvalid() throws Exception {

        List<RecurringTransactionDTO> outflowStream = new ArrayList<>();
        outflowStream.add(createRecurringTransaction());
        List<RecurringTransactionDTO> inflowStream = new ArrayList<>();
        inflowStream.add(createRecurringTransaction());
        RecurringTransactionRequest request = new RecurringTransactionRequest(outflowStream, inflowStream);

        String jsonString = objectMapper.writeValueAsString(null);

        mockMvc.perform(post("/api/recurring-transactions/")
        .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAddRecurringTransaction_whenRequestBodyIsValid() throws Exception {
        List<RecurringTransactionDTO> outflowStream = new ArrayList<>();
        outflowStream.add(createRecurringTransaction());
        List<RecurringTransactionDTO> inflowStream = new ArrayList<>();
        inflowStream.add(createRecurringTransaction());
        RecurringTransactionRequest request = new RecurringTransactionRequest(outflowStream, inflowStream);
        List<RecurringTransactionEntity> expected = new ArrayList<>();
        expected.add(createRecurringTransactionEntity());

        Mockito.when(recurringTransactionService.createRecurringTransactions(any(), any()))
                .thenReturn(expected);

        String jsonString = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/recurring-transactions/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(content().json(objectMapper.writeValueAsString(expected)));
    }

    @Test
    void testGetRecurringTransactionsByDateRange_whenUserIdInvalid() throws Exception {
        Long userId = -1L;
        mockMvc.perform(get("/api/recurring-transactions/{userId}/by-date-range", userId)
                .param("start", "2020-01-01")
                .param("end", "2020-01-31"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetRecurringTransactionsByDateRange_whenStartDateIsNull() throws Exception {
        Long userId = 1L;
        mockMvc.perform(get("/api/recurring-transactions/{userId}/by-date-range", userId)
                .param("start", (String) null)
                .param("end", "2020-01-31"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetRecurringTransactionsByDateRange_whenEndDateIsNull() throws Exception {
        Long userId = 1L;
        mockMvc.perform(get("/api/recurring-transactions/{userId}/by-date-range", userId)
                .param("start", "2020-01-31")
                .param("end", (String) null))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetRecurringTransactionsByDateRange_whenParametersValid() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2020, 1, 31);
        LocalDate endDate = LocalDate.of(2020, 2, 5);

        List<RecurringTransactionEntity> expected = new ArrayList<>();
        expected.add(createRecurringTransactionEntity());
        Mockito.when(recurringTransactionService.findByUserAndDateRange(userId, startDate, endDate))
                        .thenReturn(expected);

        mockMvc.perform(get("/api/recurring-transactions/{userId}/by-date-range", userId)
                .param("startDate", "2020-01-31")
                .param("endDate", "2020-02-05"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    private RecurringTransactionDTO createRecurringTransaction() {
        return new RecurringTransactionDTO(
                1L,                     // userId
                "ACC123",               // accountId
                "STREAM456",            // streamId
                "CAT789",               // categoryId
                "Monthly Subscription", // description
                "Netflix",              // merchantName
//                LocalDate.of(2023, 1, 1),           // firstDate
//                LocalDate.of(2024, 1,1),           // lastDate
                "2023-01-01",
                "2024-01-01",
                "MONTHLY",              // frequency
                new AmountDTO(new BigDecimal("9.99"), "", ""),
                new AmountDTO(new BigDecimal("9.99"), "", ""),
                true,                   // active
                "SUBSCRIPTION"          // type
        );
    }


    private RecurringTransactionEntity createRecurringTransactionEntity(){
        RecurringTransactionEntity recurringTransaction = new RecurringTransactionEntity();
        recurringTransaction.setAccount(AccountEntity.builder().id("ACC123").build());
        recurringTransaction.setActive(true);
        recurringTransaction.setStreamId("STREAM456");
        recurringTransaction.setType(RecurringTransactionType.INFLOW_STREAM.getValue());
        recurringTransaction.setAverageAmount(BigDecimal.ONE);
        recurringTransaction.setMerchantName("Netflix");
        recurringTransaction.setFrequency("MONTHLY");
        recurringTransaction.setDescription("Monthly Subscription");
        recurringTransaction.setFirstDate(LocalDate.parse("2023-01-01"));
        recurringTransaction.setLastDate(LocalDate.parse("2024-01-01"));
        recurringTransaction.setCategory(CategoryEntity.builder().id("CAT123").build());
        recurringTransaction.setUser(UserEntity.builder().id(1L).build());
        recurringTransaction.setAccount(AccountEntity.builder().id("ACC123").build());
        return recurringTransaction;
    }

    @AfterEach
    void tearDown() {
    }
}