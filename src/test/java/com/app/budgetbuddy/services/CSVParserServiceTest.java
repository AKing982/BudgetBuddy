package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class CSVParserServiceTest {

    private CSVParserService csvParserService;

    @BeforeEach
    void setUp() {
        csvParserService = new CSVParserService();
    }

    @Test
    void testParseCsv_whenFileIsNull_thenThrowException() {
        MultipartFile file = null;
        String institution = "Granite Credit Union";
        assertThrows(DataException.class, () -> {
            csvParserService.parseCSV(file, institution);
        });
    }

    @Test
    void testParseCsv_whenInstitutionNameIsEmpty_thenReturnEmptyList(){
        MultipartFile file = mock(MultipartFile.class);
        String institution = "";
        List<TransactionCSV> results =  csvParserService.parseCSV(file, institution);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void testParseCsv_whenFileIsValid_thenReturnTransactionCSVList(){
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "12345\t001\t1\t01/15/2024\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2024\t14:30:00\t1000.00\n" +
                "12345\t001\t2\t01/16/2024\t-25.50\tGas Station\tShell Gas\t01/16/2024\t08:15:00\t974.50\n" +
                "12345\t001\t3\t01/17/2024\t1500.00\tPayroll Deposit\tDirect Deposit\t01/17/2024\t09:00:00\t2474.50";
        MultipartFile file = new MockMultipartFile("file", "transactions.csv", "text/csv", csvContent.getBytes());
        String institution = "Granite Credit Union";

        List<TransactionCSV> expected = new ArrayList<>();
        TransactionCSV transaction1 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(1L)
                .transactionDate(LocalDate.of(2024, 1, 15))
                .transactionAmount(new BigDecimal("-50.00"))
                .description("Grocery Store")
                .extendedDescription("Walmart Purchase")
                .electronicTransactionDate(LocalDate.of(2024, 1, 15))
                .balance(new BigDecimal("1000.00"))
                .build();
        expected.add(transaction1);

        TransactionCSV transaction2 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(2L)
                .transactionDate(LocalDate.of(2024, 1, 16))
                .transactionAmount(new BigDecimal("-25.50"))
                .description("Gas Station")
                .extendedDescription("Shell Gas")
                .electronicTransactionDate(LocalDate.of(2024, 1, 16))
                .balance(new BigDecimal("974.50"))
                .build();
        expected.add(transaction2);

        TransactionCSV transaction3 = TransactionCSV.builder()
                .account("12345")
                .suffix(1)
                .sequenceNo(3L)
                .transactionDate(LocalDate.of(2024, 1, 17))
                .transactionAmount(new BigDecimal("1500.00"))
                .description("Payroll Deposit")
                .extendedDescription("Direct Deposit")
                .electronicTransactionDate(LocalDate.of(2024, 1, 17))
                .balance(new BigDecimal("2474.50"))
                .build();
        expected.add(transaction3);

        List<TransactionCSV> results = csvParserService.parseCSV(file, institution);
        assertNotNull(results);
        assertEquals(3, results.size());
        for(int i = 0; i < results.size(); i++){
            assertEquals(expected.get(i).getAccount(), results.get(i).getAccount());
            assertEquals(expected.get(i).getSuffix(), results.get(i).getSuffix());
            assertEquals(expected.get(i).getSequenceNo(), results.get(i).getSequenceNo());
            assertEquals(expected.get(i).getTransactionDate(), results.get(i).getTransactionDate());
            assertEquals(0, expected.get(i).getTransactionAmount().compareTo(results.get(i).getTransactionAmount()));
            assertEquals(expected.get(i).getDescription(), results.get(i).getDescription());
            assertEquals(expected.get(i).getExtendedDescription(), results.get(i).getExtendedDescription());
            assertEquals(expected.get(i).getElectronicTransactionDate(), results.get(i).getElectronicTransactionDate());
            assertEquals(0, expected.get(i).getBalance().compareTo(results.get(i).getBalance()));
        }
    }

    @Test
    void testParseCsv_whenFileIsValid_MountainAmericaInstitution_thenReturnTransactionCSVList(){
        String csvContent = "Transaction ID\tPosting Date\tEffective Date\tTransaction Type\tAmount\tCheck Number\tReference Number\tDescription\tTransaction Category\tType\tBalance\tMemo\tExtended Description\n" +
                "TXN001\t01/15/2024\t01/15/2024\tDebit\t-50.00\t\t12345\tGrocery Store\tFood & Dining\tPOS\t1000.00\t\tWalmart Purchase\n" +
                "TXN002\t01/16/2024\t01/16/2024\tDebit\t-25.50\t\t12346\tGas Station\tAuto & Transport\tPOS\t974.50\t\tShell Gas\n" +
                "TXN003\t01/17/2024\t01/17/2024\tCredit\t1500.00\t\t12347\tPayroll Deposit\tIncome\tDirect Deposit\t2474.50\t\tDirect Deposit";
        MultipartFile file = new MockMultipartFile("file", "transactions.csv", "text/csv", csvContent.getBytes());
        String institution = "Mountain America Credit Union";
        List<TransactionCSV> expected = new ArrayList<>();

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
        expected.add(transaction1);

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
        expected.add(transaction2);

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
        expected.add(transaction3);
        List<TransactionCSV> results = csvParserService.parseCSV(file, institution);

        assertNotNull(results);
        assertEquals(3, results.size());

        for(int i = 0; i < results.size(); i++) {
            assertEquals(expected.get(i).getTransactionId(), results.get(i).getTransactionId());
            assertEquals(expected.get(i).getTransactionDate(), results.get(i).getTransactionDate());
            assertEquals(expected.get(i).getEffectiveDate(), results.get(i).getEffectiveDate());
            assertEquals(expected.get(i).getType(), results.get(i).getType());
            assertEquals(0, expected.get(i).getTransactionAmount().compareTo(results.get(i).getTransactionAmount()));
            assertEquals(expected.get(i).getDescription(), results.get(i).getDescription());
            assertEquals(expected.get(i).getCategory(), results.get(i).getCategory());
            assertEquals(expected.get(i).getExtendedDescription(), results.get(i).getExtendedDescription());
            assertEquals(0, expected.get(i).getBalance().compareTo(results.get(i).getBalance()));
        }
    }

    @AfterEach
    void tearDown() {
    }
}