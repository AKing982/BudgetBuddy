package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.CSVParserException;
import com.app.budgetbuddy.services.CSVParserService;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.CSVUploaderService;
import com.app.budgetbuddy.services.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CSVUploadRunnerTest {

    @Mock
    private CSVTransactionService csvTransactionService;

    @Mock
    @Qualifier("accountCSVUploaderServiceImpl")
    private CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> csvUploaderService;

    @Mock
    private UserService userService;

    @Mock
    private CSVParserService csvParserService;

    @Mock
    private CategoryRunner categoryRunner;

    private CSVUploadRunner csvUploadRunner;

    @BeforeEach
    void setUp() {
        csvUploadRunner = new CSVUploadRunner(csvTransactionService, csvUploaderService, csvParserService, userService, categoryRunner);
    }

    @Test
    void testParseCSV_whenUserHasUploadAccessAndGranite_thenParseAndReturnTrue(){
        Long userId = 1L;
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "12345\t001\t1\t01/15/2024\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2024\t14:30:00\t1000.00\n" +
                "12345\t001\t2\t01/16/2024\t-25.50\tGas Station\tShell Gas\t01/16/2024\t08:15:00\t974.50\n" +
                "12345\t001\t3\t01/17/2024\t1500.00\tPayroll Deposit\tDirect Deposit\t01/17/2024\t09:00:00\t2474.50";
        MultipartFile file = new MockMultipartFile("file", "transactions.csv", "text/csv", csvContent.getBytes());
        LocalDate startDate = LocalDate.of(2026, 2, 1);
        LocalDate endDate = LocalDate.of(2026, 3, 1);
        String institution = "Granite Credit Union";
        TransactionCSV transaction1 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(1L)
                .transactionDate(LocalDate.of(2024, 1, 15))
                .transactionAmount(new BigDecimal("-50.00"))
                .description("Grocery Store")
                .balance(new BigDecimal("1000.00"))
                .build();

        TransactionCSV transaction2 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(2L)
                .transactionDate(LocalDate.of(2024, 1, 16))
                .transactionAmount(new BigDecimal("-25.50"))
                .description("Gas Station")
                .balance(new BigDecimal("974.50"))
                .build();

        TransactionCSV transaction3 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(3L)
                .transactionDate(LocalDate.of(2024, 1, 17))
                .transactionAmount(new BigDecimal("1500.00"))
                .description("Payroll Deposit")
                .balance(new BigDecimal("2474.50"))
                .build();

        List<TransactionCSV> parsedTransactions = List.of(transaction1, transaction2, transaction3);

        // Mock account CSV data
        Set<AccountCSV> accountCSVList = Set.of(
                new AccountCSV(1L, userId, "12345", 1, "CHECKING", new BigDecimal("1000.00"))
        );

        CSVAccountEntity csvAccountEntity = new CSVAccountEntity();
        csvAccountEntity.setId(1L);
        csvAccountEntity.setAccountNumber("12345");
        csvAccountEntity.setSuffix(1);
        List<CSVAccountEntity> csvAccountEntities = List.of(csvAccountEntity);

        // Mock CSV transaction entities
        CSVTransactionEntity csvTransactionEntity1 = new CSVTransactionEntity();
        csvTransactionEntity1.setId(1L);
        csvTransactionEntity1.setDescription("Grocery Store");

        CSVTransactionEntity csvTransactionEntity2 = new CSVTransactionEntity();
        csvTransactionEntity2.setId(2L);
        csvTransactionEntity2.setDescription("Gas Station");

        CSVTransactionEntity csvTransactionEntity3 = new CSVTransactionEntity();
        csvTransactionEntity3.setId(3L);
        csvTransactionEntity3.setDescription("Payroll Deposit");

        List<CSVTransactionEntity> csvTransactionEntities = List.of(
                csvTransactionEntity1, csvTransactionEntity2, csvTransactionEntity3
        );

        // Set up mocks
        when(userService.doesUserHaveOverride(userId)).thenReturn(true);
        when(csvParserService.parseCSV(file, institution)).thenReturn(parsedTransactions);
        when(csvUploaderService.createCSVList(anyList(), eq(userId))).thenReturn(accountCSVList);
        when(csvUploaderService.createEntityList(accountCSVList)).thenReturn(csvAccountEntities);
        Mockito.doNothing().when(csvUploaderService).saveEntities(csvAccountEntities);
        when(csvTransactionService.createCSVTransactionEntities(anyList(), eq(userId))).thenReturn(csvTransactionEntities);
        Mockito.doNothing().when(csvTransactionService).saveAllCSVTransactionEntities(csvTransactionEntities);
        Mockito.doNothing().when(categoryRunner).categorizeCSVTransactionsByRange(userId, startDate, endDate);

        boolean result = csvUploadRunner.parseCSV(file, institution, startDate, endDate, userId);
        assertTrue(result);
    }

    @Test
    void testParseCSV_whenUserHasNoUploadAccess_thenReturnFalse(){
        Long userId = 1L;
        MultipartFile file = mock(MultipartFile.class);
        LocalDate startDate = LocalDate.of(2026, 2, 1);
        LocalDate endDate = LocalDate.of(2026, 3, 1);
        String institution = "Granite Credit Union";
        Mockito.when(userService.doesUserHaveOverride(userId)).thenReturn(false);
        boolean result = csvUploadRunner.parseCSV(file, institution, startDate, endDate, userId);
        assertFalse(result);
    }

    @Test
    void testParseCsv_whenUserHasUploadAccessAndMountainAmerica_thenReturnTrue(){
        Long userId = 1L;
        String csvContent = "Transaction ID\tPosting Date\tEffective Date\tTransaction Type\tAmount\tCheck Number\tReference Number\tDescription\tTransaction Category\tType\tBalance\tMemo\tExtended Description\n" +
                "TXN001\t01/15/2024\t01/15/2024\tDebit\t-50.00\t\t12345\tGrocery Store\tFood & Dining\tPOS\t1000.00\t\tWalmart Purchase\n" +
                "TXN002\t01/16/2024\t01/16/2024\tDebit\t-25.50\t\t12346\tGas Station\tAuto & Transport\tPOS\t974.50\t\tShell Gas\n" +
                "TXN003\t01/17/2024\t01/17/2024\tCredit\t1500.00\t\t12347\tPayroll Deposit\tIncome\tDirect Deposit\t2474.50\t\tDirect Deposit";
        MultipartFile file = new MockMultipartFile("file", "transactions.csv", "text/csv", csvContent.getBytes());
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        String institution = "Mountain America Credit Union";

        // Mock parsed transactions
        TransactionCSV transaction1 = TransactionCSV.builder()
                .transactionId("TXN001")
                .transactionDate(LocalDate.of(2024, 1, 15))
                .effectiveDate(LocalDate.of(2024, 1, 15))
                .type("Debit")
                .transactionAmount(new BigDecimal("-50.00"))
                .description("Grocery Store")
                .category("Food & Dining")
                .balance(new BigDecimal("1000.00"))
                .extendedDescription("Walmart Purchase")
                .build();

        TransactionCSV transaction2 = TransactionCSV.builder()
                .transactionId("TXN002")
                .transactionDate(LocalDate.of(2024, 1, 16))
                .effectiveDate(LocalDate.of(2024, 1, 16))
                .type("Debit")
                .transactionAmount(new BigDecimal("-25.50"))
                .description("Gas Station")
                .category("Auto & Transport")
                .balance(new BigDecimal("974.50"))
                .extendedDescription("Shell Gas")
                .build();

        TransactionCSV transaction3 = TransactionCSV.builder()
                .transactionId("TXN003")
                .transactionDate(LocalDate.of(2024, 1, 17))
                .effectiveDate(LocalDate.of(2024, 1, 17))
                .type("Credit")
                .transactionAmount(new BigDecimal("1500.00"))
                .description("Payroll Deposit")
                .category("Income")
                .balance(new BigDecimal("2474.50"))
                .extendedDescription("Direct Deposit")
                .build();

        List<TransactionCSV> parsedTransactions = List.of(transaction1, transaction2, transaction3);

        // Mock CSV transaction entities
        CSVTransactionEntity csvTransactionEntity1 = new CSVTransactionEntity();
        csvTransactionEntity1.setId(1L);
        csvTransactionEntity1.setDescription("Grocery Store");
//        csvTransactionEntity1.setTransactionId("TXN001");

        CSVTransactionEntity csvTransactionEntity2 = new CSVTransactionEntity();
        csvTransactionEntity2.setId(2L);
        csvTransactionEntity2.setDescription("Gas Station");
//        csvTransactionEntity2.setTransactionId("TXN002");

        CSVTransactionEntity csvTransactionEntity3 = new CSVTransactionEntity();
        csvTransactionEntity3.setId(3L);
        csvTransactionEntity3.setDescription("Payroll Deposit");
//        csvTransactionEntity3.setTransactionId("TXN003");

        List<CSVTransactionEntity> csvTransactionEntities = List.of(
                csvTransactionEntity1, csvTransactionEntity2, csvTransactionEntity3
        );

        // Set up mocks
        when(userService.doesUserHaveOverride(userId)).thenReturn(true);
        when(csvParserService.parseCSV(file, institution)).thenReturn(parsedTransactions);
        // Note: No account CSV creation for Mountain America (only for Granite)
        when(csvTransactionService.createCSVTransactionEntities(anyList(), eq(userId))).thenReturn(csvTransactionEntities);
        Mockito.doNothing().when(csvTransactionService).saveAllCSVTransactionEntities(csvTransactionEntities);
        Mockito.doNothing().when(categoryRunner).categorizeCSVTransactionsByRange(userId, startDate, endDate);

        // Execute
        boolean result = csvUploadRunner.parseCSV(file, institution, startDate, endDate, userId);

        // Verify
        assertTrue(result);
        Mockito.verify(userService).doesUserHaveOverride(userId);
        Mockito.verify(csvParserService).parseCSV(file, institution);
        // Verify account CSV services are NOT called for Mountain America
        Mockito.verify(csvUploaderService, Mockito.never()).createCSVList(anyList(), anyLong());
        Mockito.verify(csvUploaderService, Mockito.never()).createEntityList(anySet());
        Mockito.verify(csvUploaderService, Mockito.never()).saveEntities(anyList());
        // Verify transaction services ARE called
        Mockito.verify(csvTransactionService).createCSVTransactionEntities(anyList(), eq(userId));
        Mockito.verify(csvTransactionService).saveAllCSVTransactionEntities(csvTransactionEntities);
        Mockito.verify(categoryRunner).categorizeCSVTransactionsByRange(userId, startDate, endDate);
    }

    @Test
    void testParseCSV_whenExceptionIsThrown_thenReturnFalse(){
        Long userId = 1L;
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "12345\t001\t1\t01/15/2024\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2024\t14:30:00\t1000.00\n";
        MultipartFile file = new MockMultipartFile("file", "transactions.csv", "text/csv", csvContent.getBytes());
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        String institution = "Granite Credit Union";

        // Mock parsed transactions
        TransactionCSV transaction1 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(1L)
                .transactionDate(LocalDate.of(2024, 1, 15))
                .transactionAmount(new BigDecimal("-50.00"))
                .description("Grocery Store")
                .balance(new BigDecimal("1000.00"))
                .build();

        List<TransactionCSV> parsedTransactions = List.of(transaction1);

        // Set up mocks - throw exception when saving transaction entities
        when(userService.doesUserHaveOverride(userId)).thenReturn(true);
        when(csvParserService.parseCSV(file, institution)).thenReturn(parsedTransactions);
        when(csvUploaderService.createCSVList(anyList(), eq(userId))).thenThrow(new CSVParserException("Failed to parse csv file."));

        // Execute
        boolean result = csvUploadRunner.parseCSV(file, institution, startDate, endDate, userId);

        // Verify
        assertFalse(result);
        Mockito.verify(userService).doesUserHaveOverride(userId);
        Mockito.verify(csvParserService).parseCSV(file, institution);
        Mockito.verify(csvUploaderService).createCSVList(anyList(), eq(userId));
        // Verify subsequent methods are NOT called after exception
        Mockito.verify(csvUploaderService, Mockito.never()).createEntityList(anySet());
        Mockito.verify(csvUploaderService, Mockito.never()).saveEntities(anyList());
        Mockito.verify(csvTransactionService, Mockito.never()).createCSVTransactionEntities(anyList(), anyLong());
        Mockito.verify(csvTransactionService, Mockito.never()).saveAllCSVTransactionEntities(anyList());
        Mockito.verify(categoryRunner, Mockito.never()).categorizeCSVTransactionsByRange(anyLong(), any(LocalDate.class), any(LocalDate.class));
    }

    @AfterEach
    void tearDown() {
    }
}