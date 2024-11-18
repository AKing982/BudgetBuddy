package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DescriptionMatchType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class TransactionPatternBuilder
{
    /**
     * Builds a description pattern based on match type needed
     * @param description Base transaction description
     * @param matchType Type of pattern matching to use
     * @param merchantList Optional list of merchants for MULTI_MERCHANT type
     * @return Pattern string for matching description(s)
     */
    public static String buildDescriptionPattern(String description, DescriptionMatchType matchType, List<String> merchantList) {
        if (description == null || description.isEmpty()) {
            return "";
        }

        String[] parts = description.split(" ");
        if (parts.length < 2) {  // Need at least transaction type (e.g., "PIN Purchase")
            return "";
        }

        // Extract transaction type (e.g., "PIN Purchase")
        String transactionType = parts[0] + " " + parts[1];

        switch (matchType) {
            case EXACT:
                return Pattern.quote(description.trim());

            case WILDCARD:
                // If description contains merchant name, keep it in pattern
                return Pattern.quote(description.trim()) + ".*";

            case MULTI_MERCHANT:
                if (merchantList == null || merchantList.isEmpty()) {
                    return "";
                }
                return Pattern.quote(transactionType) + " (" +
                        merchantList.stream()
                                .map(Pattern::quote)
                                .collect(Collectors.joining("|")) +
                        ")";

            case TYPE_ONLY:
                return Pattern.quote(transactionType) + ".*";

            default:
                return "";
        }
    }

    public static String buildDescriptionPattern(String description, DescriptionMatchType matchType) {
        return buildDescriptionPattern(description, matchType, null);
    }

    /**
     * Builds a merchant pattern that can match either single or multiple merchants
     * @param merchants List of merchant names to match
     * @return Pattern string for matching merchant(s)
     */
    public static String buildMerchantPattern(List<String> merchants) {
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
