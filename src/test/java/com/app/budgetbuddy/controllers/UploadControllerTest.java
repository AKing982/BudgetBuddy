package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import net.bytebuddy.utility.dispatcher.JavaDispatcher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.SerializationFeature;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(value = UploadController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
class UploadControllerTest
{
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private AccountService accountService;

    @MockBean
    private CSVAccountRepository csvAccountRepository;

    @MockBean
    @Qualifier("accountCSVUploaderServiceImpl")
    private CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> accountCSVUploaderService;

    @MockBean
    private CSVTransactionService csvTransactionService;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
//        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void testUploadCSV_whenFileFoundEmpty_thenReturnBadRequest() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.csv", MediaType.TEXT_PLAIN_VALUE, "".getBytes());

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(emptyFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("No File was uploaded"))
                .andExpect(jsonPath("$.isUploaded").value(false));
    }

    @Test
    void testUploadCSV_whenUserHasNoUploadAccess_thenReturnForbidden() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        // Create a CSV file with headers and sample data
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount,Description,Extended Description,Electronic Transaction Date,Balance\n" +
                "123456,9,0001,01/15/2021,50.00,Test Transaction,Test Description,01/15/2021,1000.00\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        Mockito.when(userService.doesUserHaveOverride(anyLong())).thenReturn(false);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("User 1 does not have upload access"))
                .andExpect(jsonPath("$.isUploaded").value(false));
    }

    @Test
    void testUploadCSV_whenUserHasUploadAccess_whenNoTransactionCSVsAreParsed_thenReturnBadRequest() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount,Description,Extended Description,Electronic Transaction Date,Balance\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );
        Mockito.when(userService.doesUserHaveOverride(anyLong())).thenReturn(true);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("No transactions were parsed from the uploaded CSV file"))
                .andExpect(jsonPath("$.isUploaded").value(false));
    }

    @Test
    void testUploadCSV_whenUserHasUploadAccess_whenTransactionCSVsAreParsed_thenReturnStatusOk() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount,Description,Extended Description,Electronic Transaction Date,Balance\n" +
                "123456,9,0001,01/15/2021,50.00,Test Transaction,Test Description,01/15/2021,1000.00\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );
        // Mock empty list so CSV accounts will be created
        List<AccountEntity> emptyAccountList = Collections.emptyList();

        // Mock account CSV data
        Set<AccountCSV> accountCSVList = Set.of(
                new AccountCSV(1L, userId, "123456", 9, "CHECKING", new BigDecimal("1000.00"))
        );

        CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
        csvAccountEntity.setId(1L);
        csvAccountEntity.setAccountNumber("123456");
        csvAccountEntity.setSuffix(9);
        List<CSVAccountEntity> csvAccountEntities = List.of(csvAccountEntity);

        // Mock CSV transaction entities
        CSVTransactionEntity csvTransactionEntity = new CSVTransactionEntity();
        csvTransactionEntity.setId(1L);
        csvTransactionEntity.setDescription("Test Transaction");
        List<CSVTransactionEntity> csvTransactionEntities = List.of(csvTransactionEntity);

        Mockito.when(userService.doesUserHaveOverride(anyLong())).thenReturn(true);
        Mockito.when(accountService.findByUser(anyLong())).thenReturn(emptyAccountList);
        Mockito.when(accountCSVUploaderService.createCSVList(anyList(), anyLong())).thenReturn(accountCSVList);
        Mockito.when(accountCSVUploaderService.createEntityList(anySet())).thenReturn(csvAccountEntities);
        Mockito.doNothing().when(accountCSVUploaderService).saveEntities(anyList());
        Mockito.when(csvTransactionService.createCSVTransactionEntities(anyList(), anyLong())).thenReturn(csvTransactionEntities);
        Mockito.doNothing().when(csvTransactionService).saveAllCSVTransactionEntities(anyList());

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Successfully uploaded CSV file"))
                .andExpect(jsonPath("$.isUploaded").value(true));

        // Verify interactions
        Mockito.verify(accountCSVUploaderService).createCSVList(anyList(), eq(userId));
        Mockito.verify(accountCSVUploaderService).createEntityList(anySet());
        Mockito.verify(accountCSVUploaderService).saveEntities(anyList());
        Mockito.verify(csvTransactionService).createCSVTransactionEntities(anyList(), eq(userId));
        Mockito.verify(csvTransactionService).saveAllCSVTransactionEntities(anyList());
    }

    @Test
    void testUploadCSV_whenNoTransactionCSVEntitiesAreCreated_thenReturnBadRequest() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount,Description,Extended Description,Electronic Transaction Date,Balance\n" +
                "123456,9,0001,01/15/2021,50.00,Test Transaction,Test Description,01/15/2021,1000.00\n";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        // Mock empty list so CSV accounts will be created
        List<AccountEntity> emptyAccountList = Collections.emptyList();

        // Mock account CSV data
        Set<AccountCSV> accountCSVList = Set.of(
                new AccountCSV(1L, userId, "123456", 9, "CHECKING", new BigDecimal("1000.00"))
        );

        CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
        csvAccountEntity.setId(1L);
        csvAccountEntity.setAccountNumber("123456");
        csvAccountEntity.setSuffix(9);
        List<CSVAccountEntity> csvAccountEntities = List.of(csvAccountEntity);

        List<CSVTransactionEntity> csvTransactionEntities = Collections.emptyList();

        Mockito.when(userService.doesUserHaveOverride(anyLong())).thenReturn(true);
        Mockito.when(accountService.findByUser(anyLong())).thenReturn(emptyAccountList);
        Mockito.when(accountCSVUploaderService.createCSVList(anyList(), anyLong())).thenReturn(accountCSVList);
        Mockito.when(accountCSVUploaderService.createEntityList(anySet())).thenReturn(csvAccountEntities);
        Mockito.doNothing().when(accountCSVUploaderService).saveEntities(anyList());
        Mockito.when(csvTransactionService.createCSVTransactionEntities(anyList(), anyLong())).thenReturn(csvTransactionEntities);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("No CSVTransactionEntities were created from the uploaded CSV file"))
                .andExpect(jsonPath("$.isUploaded").value(false));
        // Verify interactions
        Mockito.verify(accountCSVUploaderService).createCSVList(anyList(), eq(userId));
        Mockito.verify(accountCSVUploaderService).createEntityList(anySet());
        Mockito.verify(accountCSVUploaderService).saveEntities(anyList());
        Mockito.verify(csvTransactionService).createCSVTransactionEntities(anyList(), eq(userId));
    }

    @Test
    void testUploadCSV_whenTransactionCSVsExistingForStartDateAndEndDateRange_thenReturnConflict() throws Exception{
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount,Description,Extended Description,Electronic Transaction Date,Balance\n" +
                "123456,9,0001,01/15/2021,50.00,Test Transaction,Test Description,01/15/2021,1000.00\n";
        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );
        // Mock existing transactions
        CSVTransactionEntity existingTransaction = new CSVTransactionEntity();
        existingTransaction.setId(1L);
        existingTransaction.setDescription("Existing Transaction");
        Page<CSVTransactionEntity> existingTransactions = new PageImpl<>(List.of(existingTransaction));
        Mockito.when(userService.doesUserHaveOverride(anyLong())).thenReturn(true);
        Mockito.when(csvTransactionService.findCSVTransactionEntitiesByUserAndDateRange(anyLong(), any(LocalDate.class), any(LocalDate.class), anyInt()))
                .thenReturn(existingTransactions);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("Transactions already exist for the selected date range. Please choose a different date range or delete existing transactions first."))
                .andExpect(jsonPath("$.isUploaded").value(false));

    }

    @AfterEach
    void tearDown() {
    }
}