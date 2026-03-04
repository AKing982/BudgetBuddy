package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.workbench.GraniteTransactionParser;
import com.app.budgetbuddy.workbench.MerchantNameBuilder;
import com.app.budgetbuddy.workbench.MountainAmericaTransactionParser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CSVParserServiceTest
{
    @Mock
    private MerchantNameBuilder merchantNameBuilder;

    private GraniteTransactionParser graniteParser;
    private MountainAmericaTransactionParser mountainAmericaParser;
    private CSVParserService csvParserService;

    @BeforeEach
    void setUp() {
        graniteParser = new GraniteTransactionParser(merchantNameBuilder);
        mountainAmericaParser = new MountainAmericaTransactionParser(merchantNameBuilder);
        csvParserService = new CSVParserService(List.of(graniteParser, mountainAmericaParser));
    }

    @Test
    void testParseCsv_whenFileIsNull_thenThrowException()
    {
        assertThrows(DataException.class, () ->
                csvParserService.parseCSV(null, "Granite Credit Union", 1L));
    }

    @Test
    void testParseCsv_whenInstitutionNameIsEmpty_thenThrowException()
    {
        // New service throws DataException for unsupported institution, not empty list
        MultipartFile file = new MockMultipartFile("file", "transactions.csv",
                "text/csv", "data".getBytes());
        assertThrows(DataException.class, () ->
                csvParserService.parseCSV(file, "", 1L));
    }

    @Test
    void testParseCsv_whenInstitutionIsUnsupported_thenThrowException()
    {
        MultipartFile file = new MockMultipartFile("file", "transactions.csv",
                "text/csv", "data".getBytes());
        assertThrows(DataException.class, () ->
                csvParserService.parseCSV(file, "Unknown Bank", 1L));
    }

    @Test
    void testParseCsv_whenFileIsValid_thenReturnTransactionCSVList()
    {
        String csvContent = "Account,Suffix,Sequence Number,Transaction Date,Transaction Amount," +
                "Description,Extended Description,Electronic Transaction Date,Electronic Transaction Time,Balance\n" +
                "12345,001,1,01/15/2024,-50.00,Grocery Store,Walmart Purchase,01/15/2024,14:30:00,1000.00\n" +
                "12345,001,2,01/16/2024,-25.50,Gas Station,Shell Gas,01/16/2024,08:15:00,974.50\n" +
                "12345,001,3,01/17/2024,1500.00,Payroll Deposit,Direct Deposit,01/17/2024,09:00:00,2474.50";

        MultipartFile file = new MockMultipartFile("file", "transactions.csv",
                "text/csv", csvContent.getBytes());

        when(merchantNameBuilder.build(eq("Granite Credit Union"), eq("Grocery Store"), eq("Walmart Purchase")))
                .thenReturn("Walmart");
        when(merchantNameBuilder.build(eq("Granite Credit Union"), eq("Gas Station"), eq("Shell Gas")))
                .thenReturn("Shell Gas");
        when(merchantNameBuilder.build(eq("Granite Credit Union"), eq("Payroll Deposit"), eq("Direct Deposit")))
                .thenReturn("Direct Deposit");

        List<TransactionCSV> results = csvParserService.parseCSV(file, "Granite Credit Union", 1L);

        assertNotNull(results);
        assertEquals(3, results.size());

        TransactionCSV first = results.get(0);
        assertEquals("12345", first.getAccount());
        assertEquals(1, first.getSuffix());
        assertEquals(1L, first.getSequenceNo());
        assertEquals(LocalDate.of(2024, 1, 15), first.getTransactionDate());
        assertEquals(0, new BigDecimal("-50.00").compareTo(first.getTransactionAmount()));
        assertEquals("Grocery Store", first.getDescription());
        assertEquals("Walmart Purchase", first.getExtendedDescription());

        TransactionCSV second = results.get(1);
        assertEquals("12345", second.getAccount());
        assertEquals(2L, second.getSequenceNo());
        assertEquals(LocalDate.of(2024, 1, 16), second.getTransactionDate());
        assertEquals(0, new BigDecimal("-25.50").compareTo(second.getTransactionAmount()));
        assertEquals("Gas Station", second.getDescription());

        TransactionCSV third = results.get(2);
        assertEquals(3L, third.getSequenceNo());
        assertEquals(LocalDate.of(2024, 1, 17), third.getTransactionDate());
        assertEquals(0, new BigDecimal("1500.00").compareTo(third.getTransactionAmount()));
        assertEquals("Payroll Deposit", third.getDescription());
    }

    @Test
    void testParseCsv_whenFileIsValid_MountainAmericaInstitution_thenReturnTransactionCSVList()
    {
        String csvContent = "Transaction ID,Posting Date,Effective Date,Transaction Type,Amount," +
                "Check Number,Reference Number,Description,Transaction Category,Type,Balance,Memo,Extended Description\n" +
                "TXN001,01/15/2024,01/15/2024,Debit,-50.00,,12345,Grocery Store,Food & Dining,POS,1000.00,,Walmart Purchase\n" +
                "TXN002,01/16/2024,01/16/2024,Debit,-25.50,,12346,Gas Station,Auto & Transport,POS,974.50,,Shell Gas\n" +
                "TXN003,01/17/2024,01/17/2024,Credit,1500.00,,12347,Payroll Deposit,Income,Direct Deposit,2474.50,,Direct Deposit";

        MultipartFile file = new MockMultipartFile("file", "transactions.csv",
                "text/csv", csvContent.getBytes());

        when(merchantNameBuilder.build(eq("Mountain America Credit Union"), eq("Grocery Store"), eq("Walmart Purchase")))
                .thenReturn("Walmart");
        when(merchantNameBuilder.build(eq("Mountain America Credit Union"), eq("Gas Station"), eq("Shell Gas")))
                .thenReturn("Shell Gas");
        when(merchantNameBuilder.build(eq("Mountain America Credit Union"), eq("Payroll Deposit"), eq("Direct Deposit")))
                .thenReturn("Direct Deposit");

        List<TransactionCSV> results = csvParserService.parseCSV(file, "Mountain America Credit Union", 1L);

        assertNotNull(results);
        assertEquals(3, results.size());

        TransactionCSV first = results.get(0);
        assertEquals("TXN001", first.getTransactionId());
        assertEquals(LocalDate.of(2024, 1, 15), first.getTransactionDate());
        assertEquals(LocalDate.of(2024, 1, 15), first.getEffectiveDate());
        assertEquals("Debit", first.getType());
        assertEquals(0, new BigDecimal("-50.00").compareTo(first.getTransactionAmount()));
        assertEquals("Grocery Store", first.getDescription());
        assertEquals("Food & Dining", first.getCategory());
        assertEquals("Walmart Purchase", first.getExtendedDescription());
        assertEquals(0, new BigDecimal("1000.00").compareTo(first.getBalance()));

        TransactionCSV second = results.get(1);
        assertEquals("TXN002", second.getTransactionId());
        assertEquals(LocalDate.of(2024, 1, 16), second.getTransactionDate());
        assertEquals(0, new BigDecimal("-25.50").compareTo(second.getTransactionAmount()));
        assertEquals("Gas Station", second.getDescription());
        assertEquals("Auto & Transport", second.getCategory());

        TransactionCSV third = results.get(2);
        assertEquals("TXN003", third.getTransactionId());
        assertEquals(LocalDate.of(2024, 1, 17), third.getTransactionDate());
        assertEquals(0, new BigDecimal("1500.00").compareTo(third.getTransactionAmount()));
        assertEquals("Payroll Deposit", third.getDescription());
        assertEquals("Income", third.getCategory());
    }

    @AfterEach
    void tearDown() {
    }
}