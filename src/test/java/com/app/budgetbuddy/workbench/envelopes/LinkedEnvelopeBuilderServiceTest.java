package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LinkedEnvelopeBuilderTest {

    @Mock
    private LinkedEnvelopesService linkedEnvelopesService;

    @Mock
    private EnvelopeBuilderService envelopeBuilderService;

    @Mock
    private LinkedEnvelopeBuilderService linkedEnvelopeBuilderService;

    @InjectMocks
    private LinkedEnvelopeBuilder linkedEnvelopeBuilder;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testBuild_whenCriteriaIsNull_thenThrowEnvelopeException(){
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        assertThrows(NullPointerException.class, () -> {
            linkedEnvelopeBuilder.build(null, budgetCriteria, List.of());
        });
    }

    @Test
    void testBuild_whenCriteriaIsEmpty_thenReturnEmptyOptional()
    {
        List<NewEnvelopeCriteria> criteria = List.of();
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        Optional<EnvelopeLink> actual = linkedEnvelopeBuilder.build(criteria, budgetCriteria, List.of());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuild_whenBudgetCriteriaIsNull_thenThrowAndCatchEnvelopeException(){
        List<NewEnvelopeCriteria> criteria = List.of();
        assertThrows(NullPointerException.class, () -> {
            linkedEnvelopeBuilder.build(criteria, null, List.of());
        });
    }

    @Test
    void testBuild_whenCriteriaAndBudgetCriteriaAreValid_thenReturnEnvelopeLink()
    {
        List<NewEnvelopeCriteria> criteria = createTestEnvelopeCriteria();
        List<Envelope> envelopes = createTestEnvelopes();

        EnvelopeContribution contribution = new EnvelopeContribution();
        contribution.setEnvelope(envelopes.get(0));
        contribution.setContributions(List.of());

        EnvelopeContribution payoffContribution = new EnvelopeContribution();
        payoffContribution.setEnvelope(envelopes.get(1));
        payoffContribution.setContributions(List.of());

        List<EnvelopeContribution> contributions = new ArrayList<>();
        contributions.add(contribution);
        contributions.add(payoffContribution);
        EnvelopeLink expected = new EnvelopeLink();

        expected.setEnvelopes(contributions);
        expected.setLinkStatus("Linked");
        expected.setSharedBudget(BigDecimal.valueOf(3190));
        expected.setTotalContributionAmount(BigDecimal.valueOf(3000));
        expected.setActualContributionAmount(BigDecimal.valueOf(0));
        expected.setId(1L);

        BudgetCriteria budgetCriteria = new BudgetCriteria();
        budgetCriteria.setBudgeted(BigDecimal.valueOf(3500));
        budgetCriteria.setUserId(1L);
        budgetCriteria.setTotalEnvelopeAmount(BigDecimal.valueOf(3190));
        budgetCriteria.setActualSpent(BigDecimal.ZERO); // <-- add this
        List<SubBudget> subBudgets = createTestSubBudgets(envelopes);

        when(envelopeBuilderService.createAndSaveEnvelopes(criteria, budgetCriteria, subBudgets, true))
                .thenReturn(envelopes);

        when(envelopeBuilderService.createEnvelopeContributions(envelopes, budgetCriteria))
                .thenReturn(contributions);

        when(linkedEnvelopeBuilderService.linkEnvelopes(contributions, envelopes, BigDecimal.valueOf(3150), BigDecimal.valueOf(0)))
            .thenReturn(expected);

        Optional<EnvelopeLink> actual = linkedEnvelopeBuilder.build(criteria, budgetCriteria, subBudgets);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        EnvelopeLink envelopeLink = actual.get();
        assertEquals(expected.getEnvelopes().size(), envelopeLink.getEnvelopes().size());
        assertEquals(expected.getLinkStatus(), envelopeLink.getLinkStatus());
        assertEquals(expected.getSharedBudget(), envelopeLink.getSharedBudget());
        assertEquals(expected.getTotalContributionAmount(), envelopeLink.getTotalContributionAmount());
        assertEquals(expected.getActualContributionAmount(), envelopeLink.getActualContributionAmount());
        assertEquals(expected.getId(), envelopeLink.getId());

        assertEquals(expected.getEnvelopes().get(0).getEnvelope().getEnvelopeStatus(), envelopeLink.getEnvelopes().get(0).getEnvelope().getEnvelopeStatus());
        assertEquals(expected.getEnvelopes().get(0).getEnvelope().getEnvelopeType(), envelopeLink.getEnvelopes().get(0).getEnvelope().getEnvelopeType());
        assertEquals(expected.getEnvelopes().get(0).getEnvelope().getFrequency(), envelopeLink.getEnvelopes().get(0).getEnvelope().getFrequency());
        assertEquals(expected.getEnvelopes().get(0).getEnvelope().getBudgeted(), envelopeLink.getEnvelopes().get(0).getEnvelope().getBudgeted());
        assertEquals(expected.getEnvelopes().get(1).getEnvelope().getEnvelopeStatus(), envelopeLink.getEnvelopes().get(1).getEnvelope().getEnvelopeStatus());
        assertEquals(expected.getEnvelopes().get(1).getEnvelope().getEnvelopeType(), envelopeLink.getEnvelopes().get(1).getEnvelope().getEnvelopeType());
        assertEquals(expected.getEnvelopes().get(1).getEnvelope().getFrequency(), envelopeLink.getEnvelopes().get(1).getEnvelope().getFrequency());
        assertEquals(expected.getEnvelopes().get(1).getEnvelope().getBudgeted(), envelopeLink.getEnvelopes().get(1).getEnvelope().getBudgeted());
    }

    private List<SubBudget> createTestSubBudgets(List<Envelope> envelopes)
    {
        List<SubBudget> subBudgets = new ArrayList<>();

        LocalDate start = envelopes.stream()
                .map(Envelope::getStartDate)
                .min(LocalDate::compareTo)
                .orElseThrow(() -> new IllegalArgumentException("No envelopes provided"));

        LocalDate end = envelopes.stream()
                .map(Envelope::getTargetDate)
                .max(LocalDate::compareTo)
                .orElseThrow(() -> new IllegalArgumentException("No envelopes provided"));

        YearMonth startMonth = YearMonth.from(start);
        YearMonth endMonth = YearMonth.from(end);

        YearMonth current = startMonth;
        while (!current.isAfter(endMonth)) {

            LocalDate subBudgetStart = current.equals(startMonth) ? start : current.atDay(1);
            LocalDate subBudgetEnd = current.equals(endMonth) ? end : current.atEndOfMonth();

            Budget testBudget = Budget.builder()
                    .id(1L)
                    .budgetAmount(BigDecimal.valueOf(3000))
                    .build();

            SubBudget subBudget = SubBudget.buildSubBudget(
                    true,
                    BigDecimal.valueOf(3000),
                    BigDecimal.valueOf(500),
                    BigDecimal.valueOf(0),
                    testBudget,
                    BigDecimal.valueOf(0),
                    "Sub Budget " + current,
                    subBudgetStart,
                    subBudgetEnd
            );

            subBudgets.add(subBudget);
            current = current.plusMonths(1);
        }

        return subBudgets;
    }


    private List<Envelope> createTestEnvelopes()
    {
        List<Envelope> envelopes = new ArrayList<>();
        Envelope repairFundEnvelope = new Envelope();
        repairFundEnvelope.setFrequency("Monthly");
        repairFundEnvelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        repairFundEnvelope.setUserId(1L);
        repairFundEnvelope.setStartDate(LocalDate.of(2026, 5, 28));
        repairFundEnvelope.setEnvelopeType(EnvelopeType.FUND);
        repairFundEnvelope.setActive(true);
        repairFundEnvelope.setPaymentPlan(null);
        repairFundEnvelope.setBudgeted(BigDecimal.valueOf(2500));
        repairFundEnvelope.setLinked(true);
        repairFundEnvelope.setTargetDate(LocalDate.of(2026, 11, 15));
        repairFundEnvelope.setContributions(List.of());

        Envelope quest3PayoffEnvelope = new Envelope();
        quest3PayoffEnvelope.setFrequency("Monthly");
        quest3PayoffEnvelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        quest3PayoffEnvelope.setUserId(1L);
        quest3PayoffEnvelope.setStartDate(LocalDate.of(2026, 5, 28));
        quest3PayoffEnvelope.setEnvelopeType(EnvelopeType.PAYOFF);
        quest3PayoffEnvelope.setActive(true);

        PaymentPlan paymentPlan = new PaymentPlan();
        paymentPlan.setMerchant("Affirm");
        paymentPlan.setId(1L);
        paymentPlan.setOriginalBalance(BigDecimal.valueOf(690));
        paymentPlan.setMinimumPayment(BigDecimal.valueOf(57.5));
        paymentPlan.setPayInFour(false);
        paymentPlan.setTotalPayments(12);
        paymentPlan.setInitialPaymentDate(LocalDate.of(2026, 5, 28));
        paymentPlan.setDueDate(LocalDate.of(2027, 12, 15));
        paymentPlan.setPlanDuration(12);
        paymentPlan.setPaymentSchedules(generatePaymentSchedules(paymentPlan.getOriginalBalance(), paymentPlan.getMinimumPayment()));

        quest3PayoffEnvelope.setPaymentPlan(paymentPlan);
        quest3PayoffEnvelope.setBudgeted(BigDecimal.valueOf(650));
        quest3PayoffEnvelope.setLinked(true);
        quest3PayoffEnvelope.setTargetDate(LocalDate.of(2026, 12, 15));
        quest3PayoffEnvelope.setContributions(List.of());

        envelopes.add(repairFundEnvelope);
        envelopes.add(quest3PayoffEnvelope);

        return envelopes;
    }

    private List<NewEnvelopeCriteria> createTestEnvelopeCriteria()
    {
        List<NewEnvelopeCriteria> criteria = new ArrayList<>();
        NewEnvelopeCriteria fundCriteria = new NewEnvelopeCriteria();
        fundCriteria.setGoalName("Repair Fund");
        fundCriteria.setTargetAmount(2500);
        fundCriteria.setUserId(1L);
        fundCriteria.setFrequency("Monthly");
        fundCriteria.setStartDate(LocalDate.of(2026, 5, 28));
        fundCriteria.setEnvelopeType(EnvelopeType.FUND);
        fundCriteria.setAutoContribution(true);
        fundCriteria.setTargetDate(LocalDate.of(2026, 11, 15));
        fundCriteria.setInitialContribution(1400);

        NewEnvelopeCriteria payoffCriteria = new NewEnvelopeCriteria();
        payoffCriteria.setGoalName("Quest 3 Payoff");
        payoffCriteria.setTargetAmount(650);
        payoffCriteria.setUserId(1L);
        payoffCriteria.setFrequency("Monthly");
        payoffCriteria.setStartDate(LocalDate.of(2026, 5, 28));
        payoffCriteria.setEnvelopeType(EnvelopeType.PAYOFF);
        payoffCriteria.setAutoContribution(true);
        payoffCriteria.setTargetDate(LocalDate.of(2026, 12, 15));

        criteria.add(fundCriteria);
        criteria.add(payoffCriteria);
        return criteria;
    }


    private List<PaymentSchedule> generatePaymentSchedules(BigDecimal principal,
                                                           BigDecimal monthlyPayment) {
        List<PaymentSchedule> schedules = new ArrayList<>();

        YearMonth startMonth = YearMonth.of(2026, 5);
        BigDecimal balance = principal;
        BigDecimal monthlyRate = BigDecimal.ZERO.divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP);

        for (int i = 0; i < 12; i++)
        {
            YearMonth currentMonth = startMonth.plusMonths(i);
            LocalDate dueDate = currentMonth.atDay(1); // adjust if you need a specific day-of-month

            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalPortion = monthlyPayment.subtract(interest);
            balance = balance.subtract(principalPortion).max(BigDecimal.ZERO);

            PaymentSchedule schedule = PaymentSchedule.builder()
                    .paymentPlanId(1L)
                    .month(currentMonth)
                    .dueDate(dueDate)
                    .amount(monthlyPayment)
                    .interest(interest)
                    .balance(balance)
                    .status("PENDING")
                    .build();

            schedules.add(schedule);
        }

        return schedules;
    }



    @AfterEach
    void tearDown() {
    }
}