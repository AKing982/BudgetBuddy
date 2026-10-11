package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.InvestmentHoldingsService;
import com.app.budgetbuddy.services.InvestmentTransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PlaidInvestmentManagerTest
{
    @Mock
    private InvestmentHoldingsService investmentHoldingsService;

    @Mock
    private InvestmentTransactionService investmentTransactionService;

    @InjectMocks
    private PlaidInvestmentManager plaidInvestmentManager;



    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}