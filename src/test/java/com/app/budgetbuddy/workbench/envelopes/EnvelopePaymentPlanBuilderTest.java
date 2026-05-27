package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.services.EnvelopePaymentPlansService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopePaymentPlanBuilderTest {

    @Mock
    private EnvelopePaymentPlansService envelopePaymentPlansService;

    @Mock
    private EnvelopePaymentScheduleBuilder scheduleBuilder;

    @InjectMocks
    private EnvelopePaymentPlanBuilder envelopePaymentPlanBuilder;

    @BeforeEach
    void setUp() {
    }


    @AfterEach
    void tearDown() {
    }
}