package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.BudgetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.stream.Stream;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(controllers = BudgetController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@Testcontainers
class BudgetControllerTest {

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
    private BudgetService budgetService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void testCreateBudget_WhenRequestIsNull_thenThrowStatus400() throws Exception {

        String jsonString = objectMapper.writeValueAsString(null);
        mockMvc.perform(post("/api/budgets/")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @MethodSource("invalidBudgetRequests")
    void testCreateBudget_whenRequestParametersAreInvalid_thenThrowStatus400(BudgetCreateRequest request) throws Exception {
        String jsonString = objectMapper.writeValueAsString(request);
        mockMvc.perform(post("/api/budgets/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateBudget_whenRequestParametersAreValid_thenStatus200() throws Exception {

        Long userId = 1L;
        String budgetName = "Budget Test";
        String budgetDescription = "Budget Description";
        BigDecimal budgetAmount = BigDecimal.valueOf(450);
        BigDecimal monthlyIncome = BigDecimal.valueOf(1630);
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);

        BudgetCreateRequest budgetCreateRequest = new BudgetCreateRequest(
                userId, budgetName, budgetDescription, budgetAmount, monthlyIncome, startDate, endDate);

        Mockito.when(budgetService.createAndSaveBudget(budgetCreateRequest)).thenReturn(createBudgetEntity());

        String jsonString = objectMapper.writeValueAsString(budgetCreateRequest);
        mockMvc.perform(post("/api/budgets/")
        .contentType(MediaType.APPLICATION_JSON)
                .content(jsonString))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.user.id").value(userId))
                .andExpect(jsonPath("$.budgetName").value(budgetName))
                .andExpect(jsonPath("$.budgetDescription").value(budgetDescription))
                .andExpect(jsonPath("$.budgetAmount").value(budgetAmount))
                .andExpect(jsonPath("$.monthlyIncome").value(monthlyIncome))
                .andExpect(jsonPath("$.startDate").value(startDate.toString()))
                .andExpect(jsonPath("$.endDate").value(endDate.toString()));
    }

    @Test
    void testGetBudgetById_WhenRequestIsInvalid_thenThrowStatus400() throws Exception {
        mockMvc.perform(get("/api/budgets/{id}", -1L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetBudgetById_whenRequestIsValid_thenReturnStatus200() throws Exception {
        Long userId = 1L;
        String budgetName = "Budget Test";
        String budgetDescription = "Budget Description";
        BigDecimal budgetAmount = BigDecimal.valueOf(450);
        BigDecimal monthlyIncome = BigDecimal.valueOf(1630);
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);

        Mockito.when(budgetService.findById(userId)).thenReturn(Optional.of(createBudgetEntity()));

        mockMvc.perform(get("/api/budgets/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.user.id").value(userId))
                .andExpect(jsonPath("$.budgetName").value(budgetName))
                .andExpect(jsonPath("$.budgetDescription").value(budgetDescription))
                .andExpect(jsonPath("$.budgetAmount").value(budgetAmount))
                .andExpect(jsonPath("$.monthlyIncome").value(monthlyIncome))
                .andExpect(jsonPath("$.startDate").value(startDate.toString()))
                .andExpect(jsonPath("$.endDate").value(endDate.toString()));
    }

    @ParameterizedTest
    @MethodSource("updateBudgetTestCases")
    void testUpdateBudget(Long id, BudgetCreateRequest request, ResultMatcher expectedStatus) throws Exception {
        String jsonString = objectMapper.writeValueAsString(request);

        mockMvc.perform(put("/api/budgets/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString))
                .andExpect(expectedStatus);
    }

    @Test
    void testUpdateBudget_whenRequestParametersValid_thenReturnStatus200() throws Exception {
        Long userId = 1L;
        String budgetName = "Budget Test New";
        String budgetDescription = "Budget Description New ";
        BigDecimal budgetAmount = BigDecimal.valueOf(650);
        BigDecimal monthlyIncome = BigDecimal.valueOf(1830);
        LocalDate startDate = LocalDate.of(2024, 6, 5);
        LocalDate endDate = LocalDate.of(2024, 7, 10);
        BudgetCreateRequest updatedBudget = new BudgetCreateRequest(userId, budgetName, budgetDescription, budgetAmount, monthlyIncome, startDate, endDate);

        Mockito.when(budgetService.updateBudget(1L, updatedBudget));
    }

    private static Stream<Arguments> updateBudgetTestCases() {
        return Stream.of(
                // Valid update
                Arguments.of(1L, new BudgetCreateRequest(1L, "Updated Budget", "New Description",
                                BigDecimal.valueOf(2000), BigDecimal.valueOf(5000),
                                LocalDate.now(), LocalDate.now().plusMonths(1)),
                        status().isOk()),

                // Invalid: null budget name
                Arguments.of(1L, new BudgetCreateRequest(1L, null, "Description",
                                BigDecimal.valueOf(1000), BigDecimal.valueOf(5000),
                                LocalDate.now(), LocalDate.now().plusMonths(1)),
                        status().isBadRequest()),

                // Invalid: negative budget amount
                Arguments.of(1L, new BudgetCreateRequest(1L, "Budget", "Description",
                                BigDecimal.valueOf(-1000), BigDecimal.valueOf(5000),
                                LocalDate.now(), LocalDate.now().plusMonths(1)),
                        status().isBadRequest()),

                // Invalid: null monthly income
                Arguments.of(1L, new BudgetCreateRequest(1L, "Budget", "Description",
                                BigDecimal.valueOf(1000), null,
                                LocalDate.now(), LocalDate.now().plusMonths(1)),
                        status().isBadRequest())
        );
    }

    private BudgetEntity createBudgetEntity(){
        BudgetEntity budgetEntity = new BudgetEntity();
        budgetEntity.setBudgetAmount(BigDecimal.valueOf(450));
        budgetEntity.setMonthlyIncome(BigDecimal.valueOf(1630));
        budgetEntity.setStartDate(LocalDate.of(2024, 6, 1));
        budgetEntity.setEndDate(LocalDate.of(2024, 6, 30));
        budgetEntity.setId(1L);
        budgetEntity.setBudgetName("Budget Test");
        budgetEntity.setUser(UserEntity.builder().id(1L).build());
        budgetEntity.setCreatedDate(LocalDateTime.now());
        budgetEntity.setBudgetDescription("Budget Description");
        return budgetEntity;
    }


    private static Stream<BudgetCreateRequest> invalidBudgetRequests() {
        return Stream.of(
                // Test with null userId
                new BudgetCreateRequest(null, "Budget", "Description", BigDecimal.TEN, BigDecimal.valueOf(1000), LocalDate.now(), LocalDate.now().plusMonths(1)),

                // Test with empty budgetName
                new BudgetCreateRequest(1L, "", "Description", BigDecimal.TEN, BigDecimal.valueOf(1000), LocalDate.now(), LocalDate.now().plusMonths(1)),

                // Test with null budgetAmount
                new BudgetCreateRequest(1L, "Budget", "Description", null, BigDecimal.valueOf(1000), LocalDate.now(), LocalDate.now().plusMonths(1)),

                // Test with negative budgetAmount
                new BudgetCreateRequest(1L, "Budget", "Description", BigDecimal.valueOf(-10), BigDecimal.valueOf(1000), LocalDate.now(), LocalDate.now().plusMonths(1)),

                // Test with null monthlyIncome
                new BudgetCreateRequest(1L, "Budget", "Description", BigDecimal.TEN, null, LocalDate.now(), LocalDate.now().plusMonths(1)),

                // Test with null startDate
                new BudgetCreateRequest(1L, "Budget", "Description", BigDecimal.TEN, BigDecimal.valueOf(1000), null, LocalDate.now().plusMonths(1)),

                // Test with null endDate
                new BudgetCreateRequest(1L, "Budget", "Description", BigDecimal.TEN, BigDecimal.valueOf(1000), LocalDate.now(), null)
        );
    }

    @AfterEach
    void tearDown() {
    }
}