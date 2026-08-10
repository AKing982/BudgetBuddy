package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeBuilderService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionEngine;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeEstimatorEngine;
import com.app.budgetbuddy.workbench.envelopes.LinkedEnvelopeBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetEnvelopeRunnerTest {

    @Mock
    private EnvelopeBuilderService envelopeBuilderService;

    @Mock
    private LinkedEnvelopeBuilder linkedEnvelopeBuilderService;

    @Mock
    private EnvelopeContributionEngine envelopeContributionEngine;

    @Mock
    private LinkedEnvelopesService linkedEnvelopesService;

    @Mock
    private EnvelopeService envelopeService;

    @Mock
    private EnvelopeEstimatorEngine envelopeEstimatorEngine;

    @InjectMocks
    private BudgetEnvelopeRunner budgetEnvelopeRunner;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testRunEnvelopeCreation_whenEnvelopeCreateRequestIsNull_thenThrowException() {
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));

        assertThrows(NullPointerException.class,
                () -> budgetEnvelopeRunner.runEnvelopeCreation(null, budgetCriteria, subBudgets));
    }

    @Test
    void testRunEnvelopeCreation_whenBudgetCriteriaIsNull_thenThrowException() {
        EnvelopeCreateRequest envelopeCreateRequest = mock(EnvelopeCreateRequest.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));
        assertThrows(NullPointerException.class,
                () -> budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, null, subBudgets));
    }

    @Test
    void testRunEnvelopeCreation_whenSubBudgetsIsNull_thenThrowException() {
        EnvelopeCreateRequest envelopeCreateRequest = mock(EnvelopeCreateRequest.class);
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        assertThrows(NullPointerException.class,
                () -> budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, null));
    }

    @Test
    void testRunEnvelopeCreation_whenEnvelopeCreateRequestAndLinked_thenReturnLinkedEnvelopeBuildDetails()
    {
        List<NewEnvelopeCriteria> newEnvelopeCriteriaList = new ArrayList<>();
        NewEnvelopeCriteria newEnvelopeCriteria = new NewEnvelopeCriteria();
        newEnvelopeCriteria.setEnvelopeType(EnvelopeType.PAYOFF);
        newEnvelopeCriteria.setFrequency("MONTHLY");
        newEnvelopeCriteria.setAutoContribution(true);
        newEnvelopeCriteria.setUserId(1L);
        newEnvelopeCriteria.setStartDate(LocalDate.of(2026, 5, 5));
        newEnvelopeCriteria.setTargetDate(LocalDate.of(2026, 10, 12));
        newEnvelopeCriteria.setGoalName("Payoff Oculus Quest 3");
        newEnvelopeCriteria.setInitialContribution(100.00);
        newEnvelopeCriteriaList.add(newEnvelopeCriteria);

        EnvelopeCreateRequest envelopeCreateRequest = new EnvelopeCreateRequest(newEnvelopeCriteriaList, true);
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));

        EnvelopeLink envelopeLink = new EnvelopeLink();
        List<EnvelopeContribution> envelopeContributions = List.of(mock(EnvelopeContribution.class));
        when(envelopeContributions.get(0).getEnvelope()).thenReturn(mock(Envelope.class));
        envelopeLink.setEnvelopes(envelopeContributions);
        envelopeLink.setLinkStatus("Linked");

        EnvelopeBuildDetails expected = new EnvelopeBuildDetails();
        expected.setLinkedEnvelope(envelopeLink);
        expected.setEnvelopes(List.of(envelopeLink.getEnvelopes().get(0).getEnvelope()));

        when(linkedEnvelopeBuilderService.build(newEnvelopeCriteriaList, budgetCriteria, subBudgets)).thenReturn(Optional.of(envelopeLink));

        EnvelopeBuildDetails actual = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, subBudgets);
        assertNotNull(actual);
        assertEquals(expected.getEnvelopes(), actual.getEnvelopes());
        assertEquals(expected.getLinkedEnvelope(), actual.getLinkedEnvelope());
    }

    @Test
    void testRunEnvelopeCreation_whenEnvelopeCreateRequestAndNotLinked_thenReturnEnvelopeBuildDetails()
    {
        List<NewEnvelopeCriteria> newEnvelopeCriteriaList = new ArrayList<>();
        NewEnvelopeCriteria newEnvelopeCriteria = new NewEnvelopeCriteria();
        newEnvelopeCriteria.setEnvelopeType(EnvelopeType.PAYOFF);
        newEnvelopeCriteria.setFrequency("MONTHLY");
        newEnvelopeCriteria.setAutoContribution(true);
        newEnvelopeCriteria.setUserId(1L);
        newEnvelopeCriteria.setStartDate(LocalDate.of(2026, 5, 5));
        newEnvelopeCriteria.setTargetDate(LocalDate.of(2026, 10, 12));
        newEnvelopeCriteria.setGoalName("Payoff Oculus Quest 3");
        newEnvelopeCriteria.setInitialContribution(100.00);
        newEnvelopeCriteriaList.add(newEnvelopeCriteria);
        EnvelopeCreateRequest envelopeCreateRequest = new EnvelopeCreateRequest(newEnvelopeCriteriaList, false);
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));

        EnvelopeBuildDetails expected = new EnvelopeBuildDetails();
        Envelope envelope = new Envelope();
        envelope.setEnvelopeType(EnvelopeType.PAYOFF);
        envelope.setFrequency("MONTHLY");
        envelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope.setUserId(1L);
        envelope.setStartDate(LocalDate.of(2026, 5, 5));
        envelope.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope.setLinked(false);

        expected.setEnvelopes(List.of(envelope));
        expected.setLinkedEnvelope(null);

        when(envelopeBuilderService.createSingleEnvelope(newEnvelopeCriteria, budgetCriteria, subBudgets))
                .thenReturn(envelope);

        EnvelopeBuildDetails actual = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, subBudgets);
        assertNotNull(actual);
        assertEquals(expected.getEnvelopes(), actual.getEnvelopes());
    }

    @Test
    void testRunEnvelopeCreation_whenLinkedEnvelopeCreationFailsAndEnvelopeLinkIsNull_thenReturnEnvelopeBuildErrorDetails(){
        List<NewEnvelopeCriteria> newEnvelopeCriteriaList = new ArrayList<>();
        NewEnvelopeCriteria newEnvelopeCriteria = new NewEnvelopeCriteria();
        newEnvelopeCriteria.setEnvelopeType(EnvelopeType.PAYOFF);
        newEnvelopeCriteria.setFrequency("MONTHLY");
        newEnvelopeCriteria.setAutoContribution(true);
        newEnvelopeCriteria.setUserId(1L);
        newEnvelopeCriteria.setStartDate(LocalDate.of(2026, 5, 5));
        newEnvelopeCriteria.setTargetDate(LocalDate.of(2026, 10, 12));
        newEnvelopeCriteria.setGoalName("Payoff Oculus Quest 3");
        newEnvelopeCriteria.setInitialContribution(100.00);
        newEnvelopeCriteriaList.add(newEnvelopeCriteria);

        EnvelopeCreateRequest envelopeCreateRequest = new EnvelopeCreateRequest(newEnvelopeCriteriaList, true);
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));

        EnvelopeBuildDetails errorBuildDetails = new EnvelopeBuildDetails();
        errorBuildDetails.setErrorMessage("Failed to build linked envelope for criteria: " + newEnvelopeCriteria.getGoalName() + " with status: FAILED");
        errorBuildDetails.setLinkedEnvelope(null);
        errorBuildDetails.setEnvelopes(null);

        when(linkedEnvelopeBuilderService.build(newEnvelopeCriteriaList, budgetCriteria, subBudgets)).thenReturn(Optional.empty());

        EnvelopeBuildDetails actual = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, subBudgets);
        assertNotNull(actual);
        assertEquals(errorBuildDetails.getErrorMessage(), actual.getErrorMessage());
        assertEquals(errorBuildDetails.getLinkedEnvelope(), actual.getLinkedEnvelope());
        assertEquals(errorBuildDetails.getEnvelopes(), actual.getEnvelopes());
    }

    @Test
    void testRunEnvelopeCreation_whenNotLinkedEnvelopeAndMultipleEnvelopes_thenReturnEnvelopeBuildDetails(){
        List<NewEnvelopeCriteria> newEnvelopeCriteriaList = new ArrayList<>();
        NewEnvelopeCriteria newEnvelopeCriteria = new NewEnvelopeCriteria();
        newEnvelopeCriteria.setEnvelopeType(EnvelopeType.PAYOFF);
        newEnvelopeCriteria.setFrequency("MONTHLY");
        newEnvelopeCriteria.setAutoContribution(true);
        newEnvelopeCriteria.setUserId(1L);
        newEnvelopeCriteria.setStartDate(LocalDate.of(2026, 5, 5));
        newEnvelopeCriteria.setTargetDate(LocalDate.of(2026, 10, 12));
        newEnvelopeCriteria.setGoalName("Payoff Oculus Quest 3");
        newEnvelopeCriteria.setInitialContribution(100.00);
        newEnvelopeCriteriaList.add(newEnvelopeCriteria);

        NewEnvelopeCriteria newEnvelopeCriteria2 = new NewEnvelopeCriteria();
        newEnvelopeCriteria2.setEnvelopeType(EnvelopeType.FUND);
        newEnvelopeCriteria2.setFrequency("MONTHLY");
        newEnvelopeCriteria2.setAutoContribution(true);
        newEnvelopeCriteria2.setUserId(1L);
        newEnvelopeCriteria2.setStartDate(LocalDate.of(2026, 5, 5));
        newEnvelopeCriteria2.setTargetDate(LocalDate.of(2026, 10, 12));
        newEnvelopeCriteria2.setGoalName("Car Repair Fund");
        newEnvelopeCriteria2.setTargetAmount(3500);
        newEnvelopeCriteria2.setInitialContribution(100.00);
        newEnvelopeCriteriaList.add(newEnvelopeCriteria2);

        EnvelopeCreateRequest envelopeCreateRequest = new EnvelopeCreateRequest(newEnvelopeCriteriaList, false);
        BudgetCriteria budgetCriteria = mock(BudgetCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));

        EnvelopeBuildDetails expected = new EnvelopeBuildDetails();
        Envelope envelope = new Envelope();
        envelope.setEnvelopeType(EnvelopeType.PAYOFF);
        envelope.setFrequency("MONTHLY");
        envelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope.setUserId(1L);
        envelope.setStartDate(LocalDate.of(2026, 5, 5));
        envelope.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope.setLinked(false);

        Envelope envelope2 = new Envelope();
        envelope2.setEnvelopeType(EnvelopeType.FUND);
        envelope2.setFrequency("MONTHLY");
        envelope2.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope2.setUserId(1L);
        envelope2.setStartDate(LocalDate.of(2026, 5, 5));
        envelope2.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope2.setLinked(false);
        expected.setLinkedEnvelope(null);

        expected.setEnvelopes(List.of(envelope, envelope2));

        when(envelopeBuilderService.createSingleEnvelope(newEnvelopeCriteria, budgetCriteria, subBudgets))
                .thenReturn(envelope);
        when(envelopeBuilderService.createSingleEnvelope(newEnvelopeCriteria2, budgetCriteria, subBudgets))
                .thenReturn(envelope2);

        EnvelopeBuildDetails actual = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, subBudgets);
        assertNotNull(actual);
        assertEquals(expected.getEnvelopes(), actual.getEnvelopes());
        assertEquals(expected.getLinkedEnvelope(), actual.getLinkedEnvelope());
        assertEquals(expected.getErrorMessage(), actual.getErrorMessage());
    }

    @Test
    void testRunLinkedEnvelopeUpdate_whenEnvelopesListIsNull_thenReturnEmptyOptional(){

        Optional<EnvelopeBuildDetails> actual = budgetEnvelopeRunner.runLinkedEnvelopeUpdate(null, 1L, EnvelopeUpdateMode.ADD);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testRunLinkedEnvelopeUpdate_whenLinkedEnvelopeIdIsNull_thenReturnEmptyOptional(){
        List<Envelope> envelopes = List.of(mock(Envelope.class));
        Optional<EnvelopeBuildDetails> actual = budgetEnvelopeRunner.runLinkedEnvelopeUpdate(envelopes, null, EnvelopeUpdateMode.ADD);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testRunLinkedEnvelopeUpdate_whenLinkedEnvelopeIdNotFound_thenReturnErrorEnvelopeBuildOptional(){
        List<Envelope> envelopes = List.of(mock(Envelope.class));
        Long linkedEnvelopeId = 2L;

        when(linkedEnvelopesService.findByLinkedEnvelopeId(linkedEnvelopeId)).thenReturn(Optional.empty());

        EnvelopeBuildDetails errorEnvelopeBuildDetails = new EnvelopeBuildDetails();
        errorEnvelopeBuildDetails.setErrorMessage("Linked envelope with id: " + linkedEnvelopeId + " not found");

        Optional<EnvelopeBuildDetails> actual = budgetEnvelopeRunner.runLinkedEnvelopeUpdate(envelopes, 2L, EnvelopeUpdateMode.ADD);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(errorEnvelopeBuildDetails.getErrorMessage(), actual.get().getErrorMessage());
    }

    @Test
    void testRunLinkedEnvelopeUpdate_whenEnvelopesAlreadyLinkedToLinkedEnvelope_thenReturnErrorEnvelopeBuildOptional(){
        List<Envelope> envelopes = createTestEnvelopesLinked();

        Long linkedEnvelopeId = 1L;

        LinkedEnvelopesEntity linkedEnvelopesEntity = new LinkedEnvelopesEntity();
        Set<EnvelopeEntity> envelopeEntities = new HashSet<>(createTestEnvelopeEntities(envelopes));
        linkedEnvelopesEntity.setLinkedEnvelopeMembers(envelopeEntities);
        linkedEnvelopesEntity.setLinkName("Linked Envelopes");
        linkedEnvelopesEntity.setTotalAllocation(BigDecimal.valueOf(2300));
        linkedEnvelopesEntity.setSharedBudget(BigDecimal.valueOf(1500));

        Envelope envelope1 = envelopes.get(0);
        Envelope envelope2 = envelopes.get(1);

        EnvelopeBuildDetails errorEnvelopeBuildDetails = new EnvelopeBuildDetails();
        errorEnvelopeBuildDetails.setErrorMessage("Envelopes with ids: " + envelope1.getId() + "," + envelope2.getId()
                + " already attached to linked envelope with id: " + linkedEnvelopeId);

        EnvelopeLink envelopeLink = new EnvelopeLink();
        List<EnvelopeContribution> envelopeContributions = new ArrayList<>();
        envelopeContributions.add(EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope1)
                .contributions(List.of())
                .build());
        envelopeContributions.add(EnvelopeContribution.builder()
                .id(2L)
                .envelope(envelope2)
                .contributions(List.of())
                .build());
        envelopeLink.setEnvelopes(envelopeContributions);
        when(linkedEnvelopesService.findByLinkedEnvelopeId(1L))
                .thenReturn(Optional.of(envelopeLink));

        Optional<EnvelopeBuildDetails> actual = budgetEnvelopeRunner.runLinkedEnvelopeUpdate(envelopes, linkedEnvelopeId, EnvelopeUpdateMode.ADD);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(errorEnvelopeBuildDetails.getErrorMessage(), actual.get().getErrorMessage());
    }

    @Test
    void testRunLinkedEnvelopeUpdate_whenEnvelopesAreNotLinked_ADD_Mode_thenLinkEnvelopesToLinkedEnvelope()
    {
        List<Envelope> envelopes = createTestEnvelopesNotLinked();
        Long linkedEnvelopeId = 1L;
        EnvelopeUpdateMode ADD = EnvelopeUpdateMode.ADD;

        EnvelopeBuildDetails expected = new EnvelopeBuildDetails();
        EnvelopeLink envelopeLink = new EnvelopeLink();
        envelopeLink.setLinkStatus("Linked");

        List<EnvelopeContribution> envelopeContributions = new ArrayList<>();
        envelopeContributions.add(EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelopes.get(0))
                .contributions(List.of())
                .build());
        envelopeContributions.add(EnvelopeContribution.builder()
                .id(2L)
                .envelope(envelopes.get(1))
                .contributions(List.of())
                .build());
        envelopeLink.setEnvelopes(envelopeContributions);
        expected.setLinkedEnvelope(envelopeLink);

        when(linkedEnvelopesService.isEnvelopeLinked(1L, envelopes.get(0).getId())).thenReturn(false);
        when(linkedEnvelopesService.isEnvelopeLinked(1L, envelopes.get(1).getId())).thenReturn(false);

        when(linkedEnvelopesService.findByLinkedEnvelopeId(linkedEnvelopeId)).thenReturn(Optional.of(envelopeLink));

        Optional<EnvelopeBuildDetails> actual = budgetEnvelopeRunner.runLinkedEnvelopeUpdate(envelopes, linkedEnvelopeId, ADD);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expected.getLinkedEnvelope(), actual.get().getLinkedEnvelope());
        assertEquals(expected.getEnvelopes(), actual.get().getEnvelopes());
    }

    private List<EnvelopeEntity> createTestEnvelopeEntities(List<Envelope> envelopes)
    {
        List<EnvelopeEntity> envelopeEntities = new ArrayList<>();

        for (Envelope envelope : envelopes)
        {
            EnvelopeEntity envelopeEntity = EnvelopeEntity.builder()
                    .id(envelope.getId())
                    .name(envelope.getEnvelopeName())
                    .type(envelope.getEnvelopeType())
                    .duration(envelope.getDuration())
                    .targetDate(envelope.getTargetDate())
                    .startDate(envelope.getStartDate())
                    .budgeted(envelope.getBudgeted() != null ? envelope.getBudgeted().doubleValue() : 0.0)
                    .frequency(envelope.getFrequency())
                    .currentlySaved(envelope.getCurrentSaved() != null ? envelope.getCurrentSaved().doubleValue() : 0.0)
                    .targetAmount(envelope.getTargetAmount() != null ? envelope.getTargetAmount().doubleValue() : 0.0)
                    .contributionMode(envelope.getMode() != null ? envelope.getMode().toString() : null)
                    .isActive(envelope.isActive())
                    .status(envelope.getStatus())
                    .priority(envelope.getPriority())
                    .isLinked(envelope.isLinked())
                    .build();

            envelopeEntities.add(envelopeEntity);
        }

        return envelopeEntities;
    }

    private List<Envelope> createTestEnvelopesNotLinked(){
        List<Envelope> envelopes = new ArrayList<>();
        Envelope envelope = new Envelope();
        envelope.setEnvelopeType(EnvelopeType.PAYOFF);
        envelope.setFrequency("MONTHLY");
        envelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope.setUserId(1L);
        envelope.setId(1L);
        envelope.setStartDate(LocalDate.of(2026, 5, 5));
        envelope.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope.setLinked(false);

        Envelope envelope2 = new Envelope();
        envelope2.setEnvelopeType(EnvelopeType.FUND);
        envelope2.setFrequency("MONTHLY");
        envelope2.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope2.setUserId(1L);
        envelope2.setStartDate(LocalDate.of(2026, 5, 5));
        envelope2.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope2.setLinked(false);
        envelope2.setId(2L);
        envelopes.add(envelope);
        envelopes.add(envelope2);
        return envelopes;
    }

    private List<Envelope> createTestEnvelopesLinked()
    {
        List<Envelope> envelopes = new ArrayList<>();
        Envelope envelope = new Envelope();
        envelope.setEnvelopeType(EnvelopeType.PAYOFF);
        envelope.setFrequency("MONTHLY");
        envelope.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope.setUserId(1L);
        envelope.setId(1L);
        envelope.setStartDate(LocalDate.of(2026, 5, 5));
        envelope.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope.setLinked(true);

        Envelope envelope2 = new Envelope();
        envelope2.setEnvelopeType(EnvelopeType.FUND);
        envelope2.setFrequency("MONTHLY");
        envelope2.setEnvelopeStatus(EnvelopeStatus.ACTIVE);
        envelope2.setUserId(1L);
        envelope2.setStartDate(LocalDate.of(2026, 5, 5));
        envelope2.setTargetDate(LocalDate.of(2026, 10, 12));
        envelope2.setLinked(true);
        envelope2.setId(2L);
        envelopes.add(envelope);
        envelopes.add(envelope2);
        return envelopes;
    }


    @AfterEach
    void tearDown() {
    }
}