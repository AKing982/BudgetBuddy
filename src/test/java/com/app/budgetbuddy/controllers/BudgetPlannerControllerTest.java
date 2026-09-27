package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.BPColumnRepository;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import com.app.budgetbuddy.services.BPTemplateService;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplateRunner;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BudgetPlannerController.class, excludeAutoConfiguration = { SecurityAutoConfiguration.class })
class BudgetPlannerControllerTest {

    @MockBean
    private BPTemplateRunner bpTemplateRunner;

    @MockBean
    private BPTemplateDetailsService bpTemplateDetailsService;

    @MockBean
    private BPTemplateService bpTemplateService;

    @MockBean
    private BPColumnRepository bpColumnRepository;

    @Autowired
    private ObjectMapper objectMapper;


    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testUpdateBudgetTemplateCategories_whenValidRequest_thenReturnUpdatedTemplate() throws Exception {
        Long templateId = 1L;
        Long userId = 1L;

        BPTemplate updatedTemplate = BPTemplate.builder()
                .id(templateId)
                .templateType(BPTemplateType.BIWEEKLY_STD)
                .period(Period.BIWEEKLY)
                .build();

        when(bpTemplateRunner.syncBPTemplate(templateId, userId))
                .thenReturn(updatedTemplate);

        mockMvc.perform(put("/api/budget-planner/resync/{templateId}", templateId)
                        .param("userId", String.valueOf(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(templateId))
                .andExpect(jsonPath("$.period").value("BIWEEKLY"));
    }

    @Test
    void testUpdateBudgetTemplateCategories_whenDataExceptionThrown_thenReturn500() throws Exception {
        Long templateId = 1L;
        Long userId = 1L;

        when(bpTemplateRunner.syncBPTemplate(templateId, userId))
                .thenThrow(new DataException("Sync failed"));

        mockMvc.perform(put("/api/budget-planner/resync/{templateId}", templateId)
                        .param("userId", String.valueOf(userId)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateDefaultBudgetTemplate_whenValidUserId_thenReturnTemplate() throws Exception {
        Long userId = 1L;

        BPTemplate defaultTemplate = BPTemplate.builder()
                .id(1L)
                .templateType(BPTemplateType.BIWEEKLY_STD)
                .period(Period.BIWEEKLY)
                .build();

        when(bpTemplateRunner.runDefaultTemplateBuild(userId))
                .thenReturn(defaultTemplate);

        mockMvc.perform(post("/api/budget-planner/create-default/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void testCreateDefaultBudgetTemplate_whenDataExceptionThrown_thenReturn500() throws Exception {
        Long userId = 1L;

        when(bpTemplateRunner.runDefaultTemplateBuild(userId))
                .thenThrow(new DataException("Failed to create default template"));

        mockMvc.perform(post("/api/budget-planner/create-default/{userId}", userId))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateBudgetTemplate_whenRequestIsNull_thenReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/budget-planner/create-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("null"))
                .andExpect(status().isBadRequest());
    }



    @Test
    void testGetUserBudgetTemplates_whenValidUserId_thenReturnTemplateList() throws Exception {
        Long userId = 1L;

        BPTemplate t1 = BPTemplate.builder().id(1L).templateType(BPTemplateType.BIWEEKLY_STD).period(Period.BIWEEKLY).build();
        BPTemplate t2 = BPTemplate.builder().id(2L).templateType(BPTemplateType.BIWEEKLY_STD).period(Period.MONTHLY).build();

        when(bpTemplateService.getAllUserBudgetTemplates(userId))
                .thenReturn(List.of(t1, t2));

        mockMvc.perform(get("/api/budget-planner/templates/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }

    @Test
    void testGetUserBudgetTemplates_whenDataExceptionThrown_thenReturn500() throws Exception {
        Long userId = 1L;

        when(bpTemplateService.getAllUserBudgetTemplates(userId))
                .thenThrow(new DataException("Lookup failed"));

        mockMvc.perform(get("/api/budget-planner/templates/{userId}", userId))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateBudgetTemplate_whenNotCustom_thenReturnTemplate() throws Exception {
        Long userId = 1L;
        DateRange range = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));

        BudgetPlannerRequest request = new BudgetPlannerRequest(
                BPTemplateType.BIWEEKLY_STD, false, false, null, null,
                Period.BIWEEKLY, null, userId, List.of(range), null
        );

        BPTemplate builtTemplate = BPTemplate.builder()
                .id(2L)
                .templateType(BPTemplateType.BIWEEKLY_STD)
                .period(Period.BIWEEKLY)
                .build();

        when(bpTemplateRunner.runTemplateBuild(BPTemplateType.BIWEEKLY_STD, Period.BIWEEKLY, List.of(range), userId, null))
                .thenReturn(builtTemplate);

        mockMvc.perform(post("/api/budget-planner/create-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void testCreateBudgetTemplate_whenCustom_thenReturnTemplate() throws Exception {
        DateRange range = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));
        List<String> headers = List.of("Rent", "Groceries");

        BudgetPlannerRequest request = new BudgetPlannerRequest(
                BPTemplateType.BIWEEKLY_STD, true, true, headers, null,
                Period.BIWEEKLY, null, 1L, List.of(range), null
        );

        BPTemplate customTemplate = BPTemplate.builder()
                .id(3L)
                .templateType(BPTemplateType.BIWEEKLY_STD)
                .period(Period.BIWEEKLY)
                .build();

        when(bpTemplateRunner.runCustomTemplateBuild(BPTemplateType.BIWEEKLY_STD, Period.BIWEEKLY, true, List.of(range), headers, null, null))
                .thenReturn(customTemplate);

        mockMvc.perform(post("/api/budget-planner/create-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void testCreateBudgetTemplate_whenDataExceptionThrown_thenReturn500() throws Exception {
        Long userId = 1L;
        DateRange range = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));

        BudgetPlannerRequest request = new BudgetPlannerRequest(
                BPTemplateType.BIWEEKLY_STD, false, false, null, null,
                Period.BIWEEKLY, null, userId, List.of(range), null
        );

        when(bpTemplateRunner.runTemplateBuild(any(), any(), anyList(), anyLong(), any()))
                .thenThrow(new DataException("Build failed"));

        mockMvc.perform(post("/api/budget-planner/create-template")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testUpdateBudgetTemplateCategoryAmounts_whenValidRequest_thenReturnUpdatedTemplate() throws Exception {
        Long id = 1L;
        Long userId = 1L;
        DateRange range = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));

        // NOTE: same caveat — field order guessed from accessor call order
        // (dateRange, categories, userId) in updateBudgetTemplateCategoryAmounts.
        FuturePeriodRequest request = new FuturePeriodRequest(range, List.of(), userId);

        BPTemplate updatedTemplate = BPTemplate.builder()
                .id(id)
                .templateType(BPTemplateType.BIWEEKLY_STD)
                .period(Period.BIWEEKLY)
                .build();

        when(bpTemplateRunner.runFuturePeriodTemplateBuild(id, userId, range, List.of()))
                .thenReturn(updatedTemplate);

        mockMvc.perform(put("/api/budget-planner/{id}/update-category-amounts", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }


    @Test
    void testUpdateBudgetTemplateCategoryAmounts_whenDataExceptionThrown_thenReturn500() throws Exception {
        Long id = 1L;
        Long userId = 1L;
        DateRange range = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));

        FuturePeriodRequest request = new FuturePeriodRequest(range, List.of(), userId);

        when(bpTemplateRunner.runFuturePeriodTemplateBuild(id, userId, range, List.of()))
                .thenThrow(new DataException("Update failed"));

        mockMvc.perform(put("/api/budget-planner/{id}/update-category-amounts", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testAddFutureDateRangesToBudgetTemplateDetail_whenFuturePointerRequestIsNull_thenReturnBadRequest() throws Exception {
        Long id = 1L;
        FuturePeriodRequest request = null;
        mockMvc.perform(put("/api/budget-planner/{id}/add-future-date-ranges", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

    }

    @Test
    void testAddFutureDateRangesToBudgetTemplateDetail_whenProvidedDateRangeIsNull_thenReturnBadRequest() throws Exception {
        Long templateDetailId = 1L;
        List<FuturePeriodCategories> futurePeriodCategories = List.of(mock(FuturePeriodCategories.class));
        FuturePeriodRequest request = new FuturePeriodRequest(null, futurePeriodCategories, templateDetailId);
        mockMvc.perform(put("/api/budget-planner/{id}/add-future-date-ranges", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetDateRangeLookup_whenAllParamsMissing_thenReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/budget-planner/date-range-lookup"))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings={"ahead", "units", "currentDate", "templateId"})
    void testGetDateRangeLookup_whenRequiredParamsMissing_thenReturnBadRequest(String missingParam) throws Exception
    {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("ahead", "4");
        params.add("units", FuturePointerRequest.AheadUnit.values()[0].name());
        params.add("templateId", "1");
        params.remove(missingParam);

        mockMvc.perform(get("/api/budget-planner/date-range-lookup").params(params))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetDateRangeLookup_whenUnitsInvalid_thenReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/budget-planner/date-range-lookup")
                        .param("ahead", "4")
                        .param("units", "NOT_A_UNIT")
                        .param("templateId", "1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetDateRangeLookup_whenFourWeeksAheadMidBiweek_thenReturnOverlappingBiweeklyRanges() throws Exception {
        List<DateRange> overlapping = List.of(
                new DateRange(LocalDate.of(2026, 9, 9), LocalDate.of(2026, 9, 22)),
                new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)),
                new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)));

        when(bpColumnRepository.findByBpTemplateDetailIdAndRange(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createTestColumnEntities(overlapping, Period.BIWEEKLY));

        mockMvc.perform(get("/api/budget-planner/date-range-lookup")
                        .param("ahead", "4")
                        .param("units", "WEEKS")
                        .param("currentDate", "2026-09-15")
                        .param("templateDetailId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].startDate").value("2026-09-09"))
                .andExpect(jsonPath("$[0].endDate").value("2026-09-22"))
                .andExpect(jsonPath("$[1].startDate").value("2026-09-23"))
                .andExpect(jsonPath("$[1].endDate").value("2026-10-06"))
                .andExpect(jsonPath("$[2].startDate").value("2026-10-07"))
                .andExpect(jsonPath("$[2].endDate").value("2026-10-20"));

        verify(bpColumnRepository).findByBpTemplateDetailIdAndRange(
                eq(1L), eq(LocalDate.of(2026, 9, 15)), eq(LocalDate.of(2026, 10, 12)));
    }

    @Test
    void testAddFutureDateRangesToBudgetTemplateDetail_whenFuturePeriodCategoriesIsEmptyAndManualFalse_thenReturnBPTemplate() throws Exception{
        Long templateDetailId = 1L;
        int ahead = 4;
        FuturePointerRequest.AheadUnit aheadUnit = FuturePointerRequest.AheadUnit.WEEKS;
        BPTemplate expected = BPTemplate.builder()
                .id(10L)
                .templateType(BPTemplateType.values()[0])
                .period(Period.WEEKLY)
                .active(true)
                .isSaved(false)
                .build();
        List<FuturePeriodCategories> futurePeriodCategories = List.of(mock(FuturePeriodCategories.class));
        FuturePointerRequest request = new FuturePointerRequest(ahead, aheadUnit, templateDetailId, false, futurePeriodCategories);
        mockMvc.perform(put("/api/budget-planner/{id}/add-future-date-ranges", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.templateType").value("WEEKLY"))
                .andExpect(jsonPath("$.period").value("WEEKLY"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.saved").value(false));
    }

    private static List<BPColumnEntity> createTestColumnEntities(List<DateRange> dateRanges, Period period) {
        return IntStream.range(0, dateRanges.size())
                .mapToObj(i -> BPColumnEntity.builder()
                        .id((long) i + 1)
                        .columnIndex(i)
                        .startDate(dateRanges.get(i).getStartDate())
                        .endDate(dateRanges.get(i).getEndDate())
                        .period(period)
                        .columnType(BPColumnType.values()[0])
                        .isHeader(false)
                        .build())
                .toList();
    }





    @AfterEach
    void tearDown() {
    }
}