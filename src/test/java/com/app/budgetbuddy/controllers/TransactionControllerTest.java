package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionService;
import com.jayway.jsonpath.JsonPath;
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
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(value=TransactionController.class, excludeAutoConfiguration= SecurityAutoConfiguration.class)
class TransactionControllerTest
{

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TransactionService transactionService;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private CSVTransactionService csvTransactionService;

    private ObjectMapper objectMapper = new ObjectMapper();


    @BeforeEach
    void setUp() {
    }

    @Test
    void testGetAllTransactions() throws Exception {

        List<TransactionsEntity> transactionsEntityList = new ArrayList<>();
        TransactionsEntity transactionsEntity = createTransactionsEntity();
        transactionsEntity.setAccount(createAccountEntity());
        transactionsEntityList.add(transactionsEntity);
        when(transactionService.findAll()).thenReturn(transactionsEntityList);

        MvcResult result = mockMvc.perform(get("/api/transaction/")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(transactionsEntity.getId())))
                .andExpect(jsonPath("$[0].account.id", is(transactionsEntity.getAccount().getId())))
                .andExpect(jsonPath("$[0].category.id", is(transactionsEntity.getCategory().getId())))
                .andExpect(jsonPath("$[0].description", is(transactionsEntity.getDescription())))
                .andExpect(jsonPath("$[0].isoCurrencyCode", is(transactionsEntity.getIsoCurrencyCode())))
                .andExpect(jsonPath("$[0].merchantName", is(transactionsEntity.getMerchantName())))
                .andExpect(jsonPath("$[0].pending", is(transactionsEntity.isPending())))
                .andExpect(jsonPath("$[0].logoUrl", is(transactionsEntity.getLogoUrl())))
                .andReturn();

        String content = result.getResponse().getContentAsString();

        // Verify BigDecimal amount
        BigDecimal expectedAmount = transactionsEntity.getAmount();
        BigDecimal actualAmount = new BigDecimal(JsonPath.read(content, "$[0].amount").toString());
        assertThat(actualAmount.compareTo(expectedAmount)).isZero();

        // Verify date fields
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        LocalDate expectedPosted = transactionsEntity.getPosted();
        LocalDate actualPosted = LocalDate.parse(JsonPath.read(content, "$[0].posted").toString(), formatter);
        assertThat(actualPosted).isEqualTo(expectedPosted);

        LocalDate expectedAuthorizedDate = transactionsEntity.getAuthorizedDate();
        LocalDate actualAuthorizedDate = LocalDate.parse(JsonPath.read(content, "$[0].authorizedDate").toString(), formatter);
        assertThat(actualAuthorizedDate).isEqualTo(expectedAuthorizedDate);

        LocalDate expectedCreatedDate = transactionsEntity.getCreateDate();
        LocalDate actualCreatedDate = LocalDate.parse(JsonPath.read(content, "$[0].createDate").toString(), formatter);
        assertThat(actualCreatedDate).isEqualTo(expectedCreatedDate);
    }

    @Test
    void testGetTransactionsByAmountRange() throws Exception{

        BigDecimal startAmount = new BigDecimal("120");
        BigDecimal endAmount = new BigDecimal("200");
        List<TransactionsEntity> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionsEntityWithAmount(new BigDecimal("120")));
        expectedTransactions.add(createTransactionsEntityWithAmount(new BigDecimal("200")));
        when(transactionService.getTransactionsByAmountBetween(startAmount, endAmount)).thenReturn(expectedTransactions);

        MvcResult result = mockMvc.perform(get("/api/transaction/by-amount-range")
                        .contentType(MediaType.APPLICATION_JSON)
                .param("startAmount", String.valueOf(startAmount))
                .param("endAmount", String.valueOf(endAmount)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        List<Map<String, Object>> transactions = JsonPath.read(content, "$");

        assertThat(transactions).hasSize(2);

        BigDecimal firstAmount = new BigDecimal(transactions.get(0).get("amount").toString());
        BigDecimal secondAmount = new BigDecimal(transactions.get(1).get("amount").toString());
        assertThat(firstAmount).isGreaterThanOrEqualTo(startAmount).isLessThanOrEqualTo(endAmount);
        assertThat(secondAmount).isGreaterThanOrEqualTo(startAmount).isLessThanOrEqualTo(endAmount);

        assertThat(Optional.ofNullable(JsonPath.read(content, "$[0].id"))).isNotNull();
        assertThat(Optional.ofNullable(JsonPath.read(content, "$[1].id"))).isNotNull();

    }

    @Test
    void testGetPendingTransactionsForUser_whenUserIdInvalid() throws Exception {
        Long userId = -1L;
        mockMvc.perform(get("/api/transaction/{userId}/pending", userId)
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());
    }

    @Test
    void testGetPendingTransactionsForUser_whenUserIdValid() throws Exception{
        Long userId = 1L;

        List<TransactionsEntity> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionsEntityWithAmount(new BigDecimal("120")));
        expectedTransactions.add(createTransactionsEntityWithAmount(new BigDecimal("200")));

        when(transactionService.getTransactionsByPendingTrue()).thenReturn(expectedTransactions);

        MvcResult result = mockMvc.perform(get("/api/transaction/{userId}/pending", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        List<Map<String, Object>> transactions = JsonPath.read(content, "$");

       assertThat(transactions).hasSize(2);

       assertThat(transactions.get(0).get("id")).isEqualTo(1);
       assertThat(transactions.get(0).get("amount")).isEqualTo(120);
       assertThat(transactions.get(1).get("id")).isEqualTo(1);
       assertThat(transactions.get(1).get("amount")).isEqualTo(200);

       verify(transactionService).getTransactionsByPendingTrue();
    }

    @Test
    void testGetTransactionsByAmount() throws Exception{

        BigDecimal startAmount = new BigDecimal("120");
        List<TransactionsEntity> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionsEntityWithAmount(new BigDecimal("120")));
        when(transactionService.getTransactionsByAmount(startAmount)).thenReturn(expectedTransactions);

        MvcResult result = mockMvc.perform(get("/api/transaction/by-amount")
                .param("startAmount", String.valueOf(new BigDecimal("120")))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        List<Map<String, Object>> transactions = JsonPath.read(content, "$");
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).get("id")).isEqualTo(1);
        assertThat(transactions.get(0).get("amount")).isEqualTo(120);
    }

    @Test
    void testGetTransactionsByDate() throws Exception{
        LocalDate testDate = LocalDate.parse("2024-06-01");
        List<TransactionsEntity> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionsEntity());

        when(transactionService.getTransactionsByAuthorizedDate(testDate)).thenReturn(expectedTransactions);

        MvcResult result = mockMvc.perform(get("/api/transaction/by-date")
                .contentType(MediaType.APPLICATION_JSON)
                .param("date", String.valueOf(testDate)))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        List<Map<String, Object>> transactions = JsonPath.read(content, "$");
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).get("id")).isEqualTo(1);
        assertThat(transactions.get(0).get("amount")).isEqualTo(120);
    }

    @Test
    void testGetTransactionsForUserByDateRange() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2024, 6, 1);
        LocalDate endDate = LocalDate.of(2024, 6, 30);
        List<TransactionsEntity> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionsEntity());

        when(transactionService.getTransactionsForUserAndDateRange(userId, startDate, endDate)).thenReturn(expectedTransactions);
        MvcResult result = mockMvc.perform(get("/api/transaction/{userId}/by-date", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .param("startDate", String.valueOf(startDate))
                .param("endDate", String.valueOf(endDate)))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        List<Map<String, Object>> transactions = JsonPath.read(content, "$");
        assertThat(transactions).hasSize(1);
        assertThat(transactions.get(0).get("id")).isEqualTo(1);
        assertThat(transactions.get(0).get("amount")).isEqualTo(120);
    }

    @Test
    void testGetCsvTransactionsForUser_whenUserIdInvalid() throws Exception{
        Long userId = -1L;
        mockMvc.perform(get("/api/transaction/{userId}/csv", userId)
                        .param("startDate", "2024-06-01")
                        .param("endDate", "2024-06-30")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetCsvTransactionsForUser_whenUserIdValid() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2024, 11, 1);
        LocalDate endDate = LocalDate.of(2024, 11, 30);
        List<TransactionCSV> expectedTransactions = new ArrayList<>();
        expectedTransactions.add(createTransactionCSV());

        when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(expectedTransactions);

        mockMvc.perform(get("/api/transaction/{userId}/csv", userId)
                .param("startDate", "2025-11-01")
                .param("endDate", "2025-11-30")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }

    private TransactionCSV createTransactionCSV() {
        return new TransactionCSV(
                1L,
                "12345678",
                1,
                1000L,
                LocalDate.of(2024, 6, 15),
                new BigDecimal("100.50"),
                "Test Transaction",
                "Test Merchant",
                "Extended description",
                LocalDate.of(2024, 6, 15),
                new BigDecimal("1500.00")
        );
    }



    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setId(1L);
        userEntity.setUsername("username");
        userEntity.setPassword("password");
        return userEntity;
    }

    private AccountEntity createAccountEntity() {
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setBalance(BigDecimal.valueOf(100));
        accountEntity.setAccountName("testAccountName");
        accountEntity.setId("343232");
        accountEntity.setMask("0000");
        accountEntity.setType(AccountType.DEPOSITORY);
        accountEntity.setUser(createUserEntity());
        accountEntity.setSubtype(AccountSubType.CHECKING);
        return accountEntity;
    }

    private CategoryEntity createCategoryEntity() {
        CategoryEntity category = new CategoryEntity();
        category.setId("56763344");
        category.setCreatedBy(1L);
        category.setCustom(true);
        category.setActive(true);
        category.setName("Travel");
        category.setDescription("Travel description");
        category.setType("Transportation");
        return category;
    }

    private TransactionsEntity createTransactionsEntityWithAmount(BigDecimal amount){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setLogoUrl("testLogo");
        transactionsEntity.setDescription("description");
        transactionsEntity.setAmount(amount);
        transactionsEntity.setCreateDate(LocalDate.now());
        transactionsEntity.setId("e232323232");
        transactionsEntity.setPosted(LocalDate.now());
//        transactionsEntity.setCategoryId("522223");
        transactionsEntity.setMerchantName("testMerchantName");
        transactionsEntity.setIsoCurrencyCode("USD");
        transactionsEntity.setPending(false);
        transactionsEntity.setAccount(createAccountEntity());
        return transactionsEntity;
    }

    private TransactionsEntity createTransactionsEntity(){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setLogoUrl("testLogo");
        transactionsEntity.setDescription("description");
        transactionsEntity.setAmount(new BigDecimal("120"));
        transactionsEntity.setCreateDate(LocalDate.now());
        transactionsEntity.setId("e232323232");
        transactionsEntity.setCategory(createCategoryEntity());
        transactionsEntity.setPosted(LocalDate.now());
        transactionsEntity.setAuthorizedDate(LocalDate.of(2024, 6, 1));
        transactionsEntity.setMerchantName("testMerchantName");
        transactionsEntity.setIsoCurrencyCode("USD");
        transactionsEntity.setPending(true);
        transactionsEntity.setAccount(createAccountEntity());
        return transactionsEntity;
    }



    @AfterEach
    void tearDown() {
    }
}