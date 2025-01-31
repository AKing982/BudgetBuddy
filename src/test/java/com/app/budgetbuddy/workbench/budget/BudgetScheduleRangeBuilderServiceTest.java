package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import jakarta.persistence.Embeddable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetScheduleRangeBuilderServiceTest
{
    @Mock
    private BudgetScheduleRangeService budgetScheduleRangeService;

    @InjectMocks
    private BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService;

    @BeforeEach
    void setUp() {
        budgetScheduleRangeBuilderService = new BudgetScheduleRangeBuilderService(budgetScheduleRangeService);
    }



    @AfterEach
    void tearDown() {
    }
}