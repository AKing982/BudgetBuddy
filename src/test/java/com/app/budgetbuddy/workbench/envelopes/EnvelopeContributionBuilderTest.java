package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeType;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeContributionBuilderTest
{
    @Mock
    private EnvelopeContributionsService envelopeContributionsService;

    @InjectMocks
    private EnvelopeContributionBuilder envelopeContributionBuilder;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testBuild_whenEnvelopeCriteriaIsValidPayOffEnvelope_thenReturnEnvelopeContributions() {
        LocalDate envelopeTargetDate = LocalDate.of(2026, 10, 1);
        LocalDate envelopeStartDate = LocalDate.of(2026, 4, 1);
        EnvelopeType envelopeType = EnvelopeType.PAYOFF;
        BigDecimal envelopeTargetAmount = BigDecimal.valueOf(850);
        BigDecimal envelopeAllocation = BigDecimal.valueOf(150);
        String frequency = "MONTHLY";
        List<Contributions> expectedContributions = new ArrayList<>();
        for(int i = 0; i < 7; i++) {
            expectedContributions.add(Contributions.builder()
                    .scheduledDate(envelopeStartDate.plusMonths(i))
                    .contributionDate(null)
                    .amount(envelopeAllocation.doubleValue())
                    .minAmount(envelopeAllocation.doubleValue())
                    .maxAmount(envelopeTargetAmount.doubleValue())
                    .frequency("MONTHLY")
                    .status("SCHEDULED").build());
        }

        List<Contributions> result = envelopeContributionBuilder.build(envelopeTargetDate, envelopeStartDate, envelopeType, frequency, envelopeTargetAmount, envelopeAllocation);
        assertNotNull(result);
        assertEquals(expectedContributions, result);
        for(int i = 0; i < result.size(); i++) {
            Contributions actual = result.get(i);
            Contributions expected = expectedContributions.get(i);
            assertEquals(expected.getScheduledDate(), actual.getScheduledDate());
            assertEquals(expected.getContributionDate(), actual.getContributionDate());
            assertEquals(expected.getAmount(), actual.getAmount());
            assertEquals(expected.getMinAmount(), actual.getMinAmount());
            assertEquals(expected.getMaxAmount(), actual.getMaxAmount());
            assertEquals(expected.getFrequency(), actual.getFrequency());
            assertEquals(expected.getStatus(), actual.getStatus());
        }
    }


    @AfterEach
    void tearDown() {
    }
}