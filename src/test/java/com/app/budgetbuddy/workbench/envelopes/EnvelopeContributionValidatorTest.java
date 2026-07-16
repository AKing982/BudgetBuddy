package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeContributionValidatorTest {

    @Mock
    private TransactionService transactionService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private AccountBalanceHistoryService accountBalanceHistoryService;

    @InjectMocks
    private EnvelopeContributionValidator envelopeContributionValidator;

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}