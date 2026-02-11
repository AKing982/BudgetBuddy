package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionImportAsyncServiceTest
{
    @Mock
    private PlaidTransactionRunner plaidTransactionRunner;

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    private TransactionImportAsyncService transactionImportAsyncService;

    @BeforeEach
    void setUp() {
        transactionImportAsyncService = new TransactionImportAsyncService(plaidTransactionRunner, transactionService, recurringTransactionService);
    }



    @AfterEach
    void tearDown() {
    }
}