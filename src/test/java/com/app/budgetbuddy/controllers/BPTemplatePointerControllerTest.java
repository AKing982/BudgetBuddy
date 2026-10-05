package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPTemplatePointerService;
import com.app.budgetbuddy.workbench.runner.BPTemplatePointerRunner;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;


import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(value= BPTemplatePointerController.class, excludeAutoConfiguration= SecurityAutoConfiguration.class)
class BPTemplatePointerControllerTest {

    @MockBean
    private BPTemplatePointerRunner bpTemplatePointerRunner;

    @MockBean
    private BPTemplatePointerService bpTemplatePointerService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    private Long templateDetailId = 1L;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testGetAllPointersForTemplateDetail_whenTemplateDetailIdMissing_thenReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/bp-template-pointers/all"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetAllPointersForTemplateDetail_whenTemplateDetailIdNotANumber_thenReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/bp-template-pointers/{templateDetailId}/all", "abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllPointersForTemplateDetail_whenTemplateDetailIdValid_thenReturnPointersAndOk() throws Exception{
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                        .templateDetailId(1L)
                        .pointerMode(PointerMode.CURRENT)
                        .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                        .isUpdateEnabled(false)
                        .isLocked(true)
                        .status("Active")
                        .build();
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .isUpdateEnabled(false)
                .isLocked(false)
                .status("Active")
                .build();
        List<BPTemplatePointer> expected = List.of(currentPointer, futurePointer);

        Mockito.when(bpTemplatePointerService.findByTemplateDetailId(anyLong()))
                .thenReturn(expected);
        String body = mockMvc.perform(get("/api/bp-template-pointers/{templateDetailId}/all", templateDetailId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<BPTemplatePointer> actual = objectMapper.readValue(body, new TypeReference<List<BPTemplatePointer>>(){});
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++){
            assertEquals(expected.get(i), actual.get(i));
        }
    }

    @Test
    void testGetAllPointersForTemplateDetail_whenPointersResponseIsNull_thenReturnStatus500() throws Exception{
        Mockito.when(bpTemplatePointerService.findByTemplateDetailId(anyLong()))
                .thenReturn(null);
        mockMvc.perform(get("/api/bp-template-pointers/{templateDetailId}/all", templateDetailId))
                .andExpect(status().isInternalServerError());

    }

    @Test
    void testGetAllPointersForTemplateDetail_whenPointersResponseIsEmpty_thenReturnStatus500() throws Exception{
        Mockito.when(bpTemplatePointerService.findByTemplateDetailId(anyLong()))
                .thenReturn(List.of());
        mockMvc.perform(get("/api/bp-template-pointers/{templateDetailId}/all", templateDetailId))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateNewCurrentPointer_whenValidTemplateDetailIdAndCurrentDate_thenReturnStatusOk() throws Exception{
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        BPTemplatePointer expected = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .build();

        Mockito.when(bpTemplatePointerRunner.createCurrentPointer(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.of(expected));

        String body = mockMvc.perform(post("/api/bp-template-pointers/{templateDetailId}/new-current", templateDetailId)
                        .param("currentDate", currentDate.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
       BPTemplatePointer actual = objectMapper.readValue(body, BPTemplatePointer.class);
       assertNotNull(actual);
       assertEquals(expected, actual);
    }

    @Test
    void testCreateNewCurrentPointer_whenCurrentPointerIsNull_thenReturnStatus500() throws Exception{
        Mockito.when(bpTemplatePointerRunner.createCurrentPointer(anyLong(), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        mockMvc.perform(post("/api/bp-template-pointers/{templateDetailId}/new-current", templateDetailId)
                        .param("currentDate", LocalDate.of(2026, 9, 23).toString()))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testCreateNewFuturePointer_whenCurrentDateIsNull_thenReturnStatus400() throws Exception{
        MoveFuturePointerRequest futureRequest = new MoveFuturePointerRequest(null, LocalDate.of(2026, 10, 7), 1L);
        mockMvc.perform(post("/api/bp-template-pointers/new-future-pointer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(futureRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateNewFuturePointer_whenNewPointerDateIsNull_thenReturnStatus400() throws Exception {
        MoveFuturePointerRequest futureRequest = new MoveFuturePointerRequest(LocalDate.of(2026, 9, 23), null, 1L);
        mockMvc.perform(post("/api/bp-template-pointers/new-future-pointer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(futureRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateNewFuturePointer_whenRequestIsValid_thenReturnStatusOk() throws Exception{
        MoveFuturePointerRequest futureRequest = new MoveFuturePointerRequest(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 7), 1L);
        BPTemplatePointer expected = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .isUpdateEnabled(false)
                .isLocked(false)
                .status("Active")
                .build();
        Mockito.when(bpTemplatePointerRunner.createFuturePointer(anyLong(), any(LocalDate.class), any(DateRange.class)))
                .thenReturn(Optional.of(expected));

        String body = mockMvc.perform(post("/api/bp-template-pointers/new-future-pointer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(futureRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        BPTemplatePointer actual = objectMapper.readValue(body, BPTemplatePointer.class);
        assertNotNull(actual);
        assertEquals(expected, actual);
    }

    @Test
    void testCreateNewFuturePointer_whenFuturePointerResponseIsEmpty_thenReturnStatus500() throws Exception{
        MoveFuturePointerRequest futureRequest = new MoveFuturePointerRequest(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 7), 1L);
        Mockito.when(bpTemplatePointerRunner.createFuturePointer(anyLong(), any(LocalDate.class), any(DateRange.class)))
                .thenReturn(Optional.empty());
        mockMvc.perform(post("/api/bp-template-pointers/new-future-pointer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(futureRequest)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testResyncPointers_whenValidTemplateDetailIdAndCurrentDate_thenReturnStatusOk() throws Exception{
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .build();
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3)))
                .isUpdateEnabled(true)
                .isLocked(false)
                .status("Active")
                .build();

        Mockito.when(bpTemplatePointerService.findByTemplateDetailId(anyLong()))
                .thenReturn(List.of(currentPointer, futurePointer));

        PointerResync expected = new PointerResync(currentPointer, futurePointer, false);
        Mockito.when(bpTemplatePointerRunner.syncPointers(any(BPTemplatePointer.class), any(BPTemplatePointer.class), any(LocalDate.class)))
                .thenReturn(Optional.of(expected));

        String body = mockMvc.perform(put("/api/bp-template-pointers/{templateDetailId}/resync", templateDetailId)
                .param("currentDate", currentDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        PointerResync actual = objectMapper.readValue(body, PointerResync.class);
        assertNotNull(actual);
        assertEquals(expected, actual);
    }

    @Test
    void testResyncPointers_whenResyncResponseIsEmpty_thenReturnStatus500() throws Exception{
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        mockMvc.perform(put("/api/bp-template-pointers/{templateDetailId}/resync", templateDetailId)
                .param("currentDate", currentDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }



    @AfterEach
    void tearDown() {
    }
}