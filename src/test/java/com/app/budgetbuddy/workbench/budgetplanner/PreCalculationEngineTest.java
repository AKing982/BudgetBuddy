package com.app.budgetbuddy.workbench.budgetplanner;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PreCalculationEngineTest
{
    @MockBean
    private PreCalculationThreadService preCalculationThreadService;

    @MockBean
    private FourierSeriesEngine fourierSeriesEngine;

    @MockBean
    private PreCalculationTrendService preCalculationTrendService;

    @MockBean
    private CategoryTypeProcessor categoryTypeProcessor;

    @Autowired
    public PreCalculationEngine preCalculationEngine;

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}