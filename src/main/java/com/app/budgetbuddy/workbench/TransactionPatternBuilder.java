package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionMatchType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionPatternBuilder
{
    private static final String WILDCARD_KEY = ".*";
    private static final String SPACE_KEY = "\\s+";
    private static final String BLANK_KEY = " ";
    private static final String PIPE_KEY = "|";
    private static final String START_KEY = "^";
    private static final String CONTAINS_KEY = ".";

    /**
     * Builds a description pattern based on match type needed
     * @param description Base transaction description
     * @param matchType Type of pattern matching to use
     * @param merchantList Optional list of merchants for MULTI_MERCHANT type
     * @return Pattern string for matching description(s)
     */
    public static String buildDescriptionPattern(final String transactionId, final String descriptionKeyword, final String transactionDescription, final TransactionMatchType matchType, final List<String> merchantList) {
        if(transactionDescription.isEmpty() || matchType == null || merchantList.isEmpty()){
            return "";
        }

        String normalizedKeyword = descriptionKeyword.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY).trim();
        String normalizedDescription = transactionDescription.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY).trim();
        switch(matchType)
        {
            case EXACT ->
            {
                return transactionDescription.replaceAll(SPACE_KEY, BLANK_KEY).trim();
            }
            case CONTAINS ->
            {
                log.info("NormalizedKeyword: {}", normalizedKeyword);
                boolean keywordMatchesOnMerchants = merchantList.stream()
                        .map(m -> m.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY))
                        .anyMatch(m -> m.equals(normalizedKeyword));
                log.info("Keyword matches on merchants: " + keywordMatchesOnMerchants);
                if(normalizedDescription.contains(normalizedKeyword) && keywordMatchesOnMerchants)
                {
                    return normalizedKeyword;
                }
                else
                {
                    // Look for spaces in the transaction description that occur where the keyword is
                    return transactionDescription;
                }
            }
            case WILDCARD -> {
                StringBuilder wildCardPattern = new StringBuilder();
                if(normalizedDescription.contains(normalizedKeyword)){
                    return wildCardPattern.append(normalizedKeyword).append(WILDCARD_KEY).toString();
                }

                for (String merchant : merchantList) {
                    String normalizedMerchant = merchant.toUpperCase().trim();
                    if (normalizedDescription.contains(normalizedMerchant)) {
                        if (!wildCardPattern.isEmpty()) {
                            wildCardPattern.append(PIPE_KEY);
                        }
                        wildCardPattern.append(normalizedMerchant)
                                .append(WILDCARD_KEY);
                    }
                }

                return !wildCardPattern.isEmpty() ? wildCardPattern.toString() : normalizedDescription;
            }
            case MULTI_MERCHANT -> {
                return merchantList.stream()
                        .map(m -> m.toUpperCase().trim())
                        .filter(normalizedDescription::contains)
                        .collect(Collectors.joining(PIPE_KEY));
            }
            case STARTS_WITH -> {
                if(normalizedDescription.startsWith(normalizedKeyword)){
                    return START_KEY + normalizedKeyword;
                }
            }
        }

        return null;
    }

    public static String buildDescriptionPattern(String keyword, String description, TransactionMatchType matchType) {
        return buildDescriptionPattern(keyword, description, matchType, null);
    }

    /**
     * Builds a merchant pattern that can match either single or multiple merchants
     * @param merchants List of merchant names to match
     * @return Pattern string for matching merchant(s)
     */
    public static String buildMerchantPattern(List<String> merchants, TransactionMatchType matchType) {
        if (merchants == null || merchants.isEmpty()) {
            return "";
        }

        if (merchants.size() == 1) {
            return Pattern.quote(merchants.get(0).trim());
        }

        return merchants.stream()
                .map(merchant -> Pattern.quote(merchant.trim()))
                .collect(Collectors.joining("|"));
    }


}
