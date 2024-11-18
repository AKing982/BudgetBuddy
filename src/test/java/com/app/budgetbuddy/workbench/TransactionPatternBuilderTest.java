package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DescriptionMatchType;
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
    void testExactDescriptionPattern() {
        String description = "PIN Purchase WINCO FOODS";
        String pattern = buildDescriptionPattern(description, DescriptionMatchType.EXACT);

        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS").find());
        assertFalse(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS #123").find());
    }

    @Test
    void testWildcardDescriptionPattern() {
        String description = "PIN Purchase WINCO FOODS";
        String pattern = buildDescriptionPattern(description, DescriptionMatchType.WILDCARD);

        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS #123").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS at Location").find());
    }

    @Test
    void testMultiMerchantDescriptionPattern() {
        String description = "PIN Purchase WINCO FOODS";
        List<String> merchants = Arrays.asList("WINCO FOODS", "WALMART", "HARMONS");
        String pattern = buildDescriptionPattern(description, DescriptionMatchType.MULTI_MERCHANT, merchants);

        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WALMART").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase HARMONS").find());
        assertFalse(Pattern.compile(pattern).matcher("PIN Purchase TARGET").find());
    }

    @Test
    void testTypeOnlyDescriptionPattern() {
        String description = "PIN Purchase WINCO FOODS";
        String pattern = buildDescriptionPattern(description, DescriptionMatchType.TYPE_ONLY);

        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WINCO FOODS").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase WALMART").find());
        assertTrue(Pattern.compile(pattern).matcher("PIN Purchase anything else").find());
        assertFalse(Pattern.compile(pattern).matcher("ACH Purchase WINCO FOODS").find());
    }

    @Test
    void testPatternWithSpecialCharacters() {
        String description = "PIN Purchase SMITH & SONS";
        List<String> merchants = Arrays.asList("SMITH & SONS", "M&M's", "B&H Photo");

        // Test each pattern type with special characters
        String exactPattern = buildDescriptionPattern(description, DescriptionMatchType.EXACT);
        String wildcardPattern = buildDescriptionPattern(description, DescriptionMatchType.WILDCARD);
        String multiMerchantPattern = buildDescriptionPattern(description, DescriptionMatchType.MULTI_MERCHANT, merchants);
        String typeOnlyPattern = buildDescriptionPattern(description, DescriptionMatchType.TYPE_ONLY);

        // Verify all patterns handle special characters correctly
        assertTrue(Pattern.compile(exactPattern).matcher("PIN Purchase SMITH & SONS").find());
        assertTrue(Pattern.compile(wildcardPattern).matcher("PIN Purchase SMITH & SONS #123").find());
        assertTrue(Pattern.compile(multiMerchantPattern).matcher("PIN Purchase M&M's").find());
        assertTrue(Pattern.compile(typeOnlyPattern).matcher("PIN Purchase anything & everything").find());
    }

    @Test
    void testInvalidInputs() {
        assertEquals("", buildDescriptionPattern(null, DescriptionMatchType.EXACT));
        assertEquals("", buildDescriptionPattern("", DescriptionMatchType.WILDCARD));
        assertEquals("", buildDescriptionPattern("PIN", DescriptionMatchType.TYPE_ONLY));
        assertEquals("", buildDescriptionPattern("PIN Purchase", DescriptionMatchType.MULTI_MERCHANT, null));
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