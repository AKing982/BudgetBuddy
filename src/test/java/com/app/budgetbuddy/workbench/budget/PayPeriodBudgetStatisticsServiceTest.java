package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.PayPeriodStatistics;
import com.app.budgetbuddy.services.PayPeriodStatisticsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class PayPeriodBudgetStatisticsServiceTest {

    @Mock
    private PayPeriodStatisticsService payPeriodStatisticsService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private TypedQuery<PayPeriodStatistics> typedQuery;

    @InjectMocks
    private PayPeriodStatisticsQueryService payPeriodBudgetStatisticsService;

    private static final Long SUB_BUDGET_ID = 1L;
    private static final LocalDate START_DATE = LocalDate.of(2026, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 1, 31);

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}