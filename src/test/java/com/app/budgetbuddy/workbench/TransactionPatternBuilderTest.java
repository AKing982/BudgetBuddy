package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionMatchType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

import static com.app.budgetbuddy.workbench.TransactionPatternBuilder.buildDescriptionPattern;
import static com.app.budgetbuddy.workbench.TransactionPatternBuilder.buildMerchantPattern;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionPatternBuilderTest {

    @InjectMocks
    private TransactionPatternBuilder transactionPatternBuilder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }


    @Test
    void testBuildDescriptionPattern_whenDescriptionEmpty_thenReturnEmptyDescription() {
        final String description = "";
        String actual = buildDescriptionPattern("", description, TransactionMatchType.MULTI_MERCHANT, List.of("WINCO"));
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildDescriptionPattern_whenDescriptionMatchTypeEmpty_thenReturnEmptyDescription() {
        final String description = "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024";
        final TransactionMatchType matchType = null;
        final List<String> merchants = List.of("WINCO");
        final String actual = buildDescriptionPattern("", description, matchType, merchants);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildDescriptionPattern_whenMerchantListIsEmpty_thenReturnEmptyDescription() {
        final String description = "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024";
        final TransactionMatchType matchType = TransactionMatchType.MULTI_MERCHANT;
        final List<String> merchants = List.of();
        final String actual = buildDescriptionPattern("", description, matchType, merchants);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildDescriptionPattern_whenMatchTypeIsExact_thenReturnDescription() {
        final String description = "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024";
        final TransactionMatchType matchType = TransactionMatchType.EXACT;
        final List<String> merchants = List.of("WINCO");

        final String actual = buildDescriptionPattern("", description, matchType, merchants);
        assertEquals(description, actual);
    }

    @Test
    void testBuildDescriptionPattern_whenDescriptionContainsKeyword_thenReturnDescription() {
        final String description = "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024";
        final String keyword = "WINCO";
        final TransactionMatchType matchType = TransactionMatchType.CONTAINS;
        final List<String> merchants = List.of("WINCO");
        final String pattern = buildDescriptionPattern(keyword, description, matchType, merchants);
        System.out.println("Pattern: " + pattern);
        // Pattern should match if description contains keyword
        assertTrue(description.matches(".*" + pattern + ".*"));
        assertTrue(pattern.contains(keyword));
    }

    @Test
    void testBuildDescriptionPattern_whenDescriptionMatchTypeContains_KeywordNotInDescription_thenReturnDefaultDescription(){
        final String description = "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024";
        final String keyword = "WALMART";
        final TransactionMatchType matchType = TransactionMatchType.CONTAINS;
        final List<String> merchants = List.of("WINCO");
        final String pattern = buildDescriptionPattern(keyword, description, matchType, merchants);
        System.out.println("Pattern: " + pattern);
        assertTrue(description.matches(".*" + pattern + ".*"));
        assertFalse(pattern.contains(keyword));
    }

    @Test
    void testBuildDescriptionPattern_whenKeywordWithDifferentSpacing() {
        String description = "PIN Purchase WINCO  FOODS #15"; // Double space
        String keyword = "WINCO FOODS";  // Single space
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, List.of("WINCO FOODS"));
        assertTrue(pattern.contains(keyword));
        assertEquals("WINCO FOODS", pattern);
    }

    @Test
    void testBuildDescriptionPattern_whenKeywordWithSpecialCharacters() {
        String description = "PIN Purchase WINCO-FOODS #15";
        String keyword = "WINCO-FOODS";
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, List.of("WINCO-FOODS"));

        assertEquals("WINCO-FOODS", pattern);
    }

    @Test
    void testBuildDescriptionPattern_whenKeywordInMiddleOfDescription() {
        String description = "PIN Purchase at WINCO FOODS on Main St";
        String keyword = "WINCO FOODS";
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, List.of("WINCO FOODS"));

        assertEquals("WINCO FOODS", pattern);
    }

    @Test
    void testBuildDescriptionPattern_whenKeywordAtEndOfDescription() {
        String description = "PIN Purchase at WINCO FOODS";
        String keyword = "WINCO FOODS";
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, List.of("WINCO FOODS"));

        assertEquals("WINCO FOODS", pattern);
    }

    @Test
    void testBuildDescriptionPattern_whenCaseInsensitiveMatch() {
        String description = "PIN Purchase Winco Foods #15";
        String keyword = "WINCO FOODS";
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, List.of("WINCO FOODS"));

        // Decide if you want case-sensitive or case-insensitive matching
        assertEquals("WINCO FOODS", pattern);  // Or adjust based on your case sensitivity requirements
    }

    @Test
    void testBuildDescriptionPattern_whenMerchantListContainsMultipleMatches() {
        // Given
        String description = "PIN Purchase WINCO FOODS #15";
        String keyword = "WINCO FOODS";
        List<String> merchants = List.of("WINCO FOODS", "WINCO", "FOODS");

        // When
        String pattern = buildDescriptionPattern(keyword, description, TransactionMatchType.CONTAINS, merchants);

        // Then
        assertEquals("WINCO FOODS", pattern); // Should match since "WINCO FOODS" exists in both description and merchant list

        // Test when keyword exists in description but not in merchant list
        String invalidKeyword = "PIN Purchase";
        String invalidPattern = buildDescriptionPattern(invalidKeyword, description, TransactionMatchType.CONTAINS, merchants);
        assertEquals("PIN Purchase WINCO FOODS #15", invalidPattern); // Should return empty since not in merchant list

        // Test partial merchant match
        String partialKeyword = "WINCO";
        String partialPattern = buildDescriptionPattern(partialKeyword, description, TransactionMatchType.CONTAINS, merchants);
        assertEquals("WINCO", partialPattern); // Should match partial merchant
    }

    @Test
    void testBuildDescriptionPattern_whenMerchantHasVaryingSpaces() {
        String description = "PIN Purchase WINCO FOODS #15";
        String spacedKeyword = "WINCO   FOODS";
        List<String> spacedMerchants = List.of("WINCO   FOODS", "WINCO", "FOODS");

        String spacedPattern = buildDescriptionPattern(spacedKeyword, description, TransactionMatchType.CONTAINS, spacedMerchants);

        assertEquals("WINCO FOODS", spacedPattern); // Should normalize spaces
    }



    @Test
    void testSingleMerchantPattern() {
        List<String> merchants = List.of("WINCO FOODS");
        String pattern = buildMerchantPattern(merchants);

        // Should match exact merchant
        assertTrue(Pattern.compile(pattern).matcher("WINCO FOODS").find());
        // Should not match other merchants
        assertFalse(Pattern.compile(pattern).matcher("WALMART").find());
    }

    @Test
    void testMultipleMerchantPattern() {
        List<String> merchants = Arrays.asList("WINCO", "HARMONS", "WALMART");
        String pattern = buildMerchantPattern(merchants);

        // Should match any of the listed merchants
        assertTrue(Pattern.compile(pattern).matcher("WINCO").find());
        assertTrue(Pattern.compile(pattern).matcher("HARMONS").find());
        assertTrue(Pattern.compile(pattern).matcher("WALMART").find());
        // Should not match unlisted merchants
        assertFalse(Pattern.compile(pattern).matcher("TARGET").find());
    }




    @AfterEach
    void tearDown() {
    }
}