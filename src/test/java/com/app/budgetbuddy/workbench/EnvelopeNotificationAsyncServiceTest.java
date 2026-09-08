package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionValidator;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeNotificationBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeNotificationAsyncServiceTest {

    @Mock
    private EnvelopeNotificationBuilder envelopeNotificationBuilder;

    @Mock
    private EnvelopeNotificationService envelopeNotificationService;

    @Mock
    private EnvelopeContributionValidator envelopeContributionValidator;

    @Mock
    private EnvelopeService envelopeService;

    @InjectMocks
    private EnvelopeNotificationAsyncService envelopeNotificationAsyncService;

    @BeforeEach
    void setUp() {
    }



    @AfterEach
    void tearDown() {
    }
}