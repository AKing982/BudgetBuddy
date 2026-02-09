package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.CSVUploadException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.runner.CSVUploadRunner;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import net.bytebuddy.utility.dispatcher.JavaDispatcher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.SerializationFeature;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@WebMvcTest(value = UploadController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
class UploadControllerTest
{
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CSVUploadRunner csvUploadRunner;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {

        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void testUploadCSV_whenFileFoundEmpty_thenReturnBadRequest() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String institution = "Granite Credit Union";
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.csv", MediaType.TEXT_PLAIN_VALUE, "".getBytes());

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(emptyFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("institution", institution)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("No File was uploaded"))
                .andExpect(jsonPath("$.isUploaded").value(false));
    }

    @Test
    void testUploadCSV_whenInstitutionIsEmpty_thenReturnBadRequest() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String institution = "";
        MockMultipartFile csvFile = new MockMultipartFile("file", "test.csv", MediaType.TEXT_PLAIN_VALUE, "some content".getBytes());

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("institution", institution)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("No institution selected"))
                .andExpect(jsonPath("$.isUploaded").value(false));
    }


    @Test
    void testUploadCSV_whenCSVUploadRunnerReturnsTrue_thenReturnSuccessStatus() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "123456\t001\t1\t01/15/2021\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2021\t14:30:00\t1000.00\n" +
                "123456\t001\t2\t01/16/2021\t-25.50\tGas Station\tShell Gas\t01/16/2021\t08:15:00\t974.50\n";
        String institution = "Granite Credit Union";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        // Mock the runner to return true (upload succeeded)
        Mockito.when(csvUploadRunner.parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        )).thenReturn(true);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("institution", institution)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CSV file has successfully uploaded"))
                .andExpect(jsonPath("$.isUploaded").value(true));

        Mockito.verify(csvUploadRunner).parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        );
    }

    @Test
    void testUploadCSV_whenCSVUploadRunnerReturnsFalse_thenReturnUploadFailedStatus() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "123456\t001\t1\t01/15/2021\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2021\t14:30:00\t1000.00\n";
        String institution = "Granite Credit Union";

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        // Mock the runner to return false (upload failed)
        Mockito.when(csvUploadRunner.parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        )).thenReturn(false);

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("institution", institution)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CSV file has not been uploaded"))
                .andExpect(jsonPath("$.isUploaded").value(false));

        Mockito.verify(csvUploadRunner).parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        );
    }

    @Test
    void testUploadCSV_whenExceptionIsThrown_thenReturnUploadFailedStatus() throws Exception {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2021, 1, 1);
        LocalDate endDate = LocalDate.of(2021, 1, 31);
        String csvContent = "Account\tSuffix\tSequence Number\tTransaction Date\tTransaction Amount\tDescription\tExtended Description\tElectronic Transaction Date\tElectronic Transaction Time\tBalance\n" +
                "123456\t001\t1\t01/15/2021\t-50.00\tGrocery Store\tWalmart Purchase\t01/15/2021\t14:30:00\t1000.00\n";
        String institution = "Granite Credit Union";
        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                csvContent.getBytes()
        );

        // Mock the runner to throw an exception
        Mockito.when(csvUploadRunner.parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        )).thenThrow(new CSVUploadException("There was an error processing the csv file:"));

        mockMvc.perform(multipart("/api/upload/" + userId + "/csv")
                        .file(csvFile)
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .param("institution", institution)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value("There was an error processing the csv file:"))
                .andExpect(jsonPath("$.isUploaded").value(false));

        Mockito.verify(csvUploadRunner).parseCSV(
                any(MultipartFile.class),
                eq(institution),
                eq(startDate),
                eq(endDate),
                eq(userId)
        );
    }


    @AfterEach
    void tearDown() {
    }
}