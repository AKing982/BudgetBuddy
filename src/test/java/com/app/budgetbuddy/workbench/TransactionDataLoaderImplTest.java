package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidStartDateException;
import com.app.budgetbuddy.services.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionDataLoaderImplTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionDataLoaderImpl transactionDataLoader;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateIsNull_thenThrowException() {
        assertThrows(IllegalDateException.class, () -> {
            transactionDataLoader.loadTransactionsByDateRange(null, LocalDate.of(2024, 9, 1));
        });
    }

    @Test
    void testLoadTransactionsByDateRange_whenEndDateIsNull_thenThrowException() {
        assertThrows(IllegalDateException.class, () -> {
            transactionDataLoader.loadTransactionsByDateRange(LocalDate.of(2024, 9, 1), null);
        });
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateIsBeforeEndDate_thenReturnEmptyList() {
        List<Transaction> actual = transactionDataLoader.loadTransactionsByDateRange(LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 1));
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateAndEndDateValid_thenReturnTransactionList(){

    }



    @AfterEach
    void tearDown() {
    }
}