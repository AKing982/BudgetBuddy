package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionMatchType;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionPatternBuilder
{
    private final String WILDCARD_KEY = ".*";
    private final String SPACE_KEY = "\\s+";
    private final String BLANK_KEY = " ";
    private final String PIPE_KEY = "|";
    private final String START_KEY = "^";
    private final String CONTAINS_KEY = ".";
    private final String INCLUDES_KEY = "%";
    private Map<String, String> transactionDescriptionPatternMap = new HashMap<>();
    private Map<String, String> transactionMerchantPatternMap = new HashMap<>();
    private final CategoryService categoryService;

    @Autowired
    public TransactionPatternBuilder(final CategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    /**
     * Builds a description pattern based on match type needed
     * @param description Base transaction description
     * @param matchType Type of pattern matching to use
     * @param merchantList Optional list of merchants for MULTI_MERCHANT type
     * @return Pattern string for matching description(s)
     */
    public String buildDescriptionPattern(final String transactionId, final String descriptionKeyword, final String transactionDescription, final TransactionMatchType matchType, final List<String> merchantList) {
        if(transactionDescription.isEmpty() || matchType == null || merchantList.isEmpty()){
            return "";
        }

        String normalizedKeyword = descriptionKeyword.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY).trim();
        String normalizedDescription = transactionDescription.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY).trim();
        String descriptionPattern = buildDescriptionPatternByMatchType(descriptionKeyword, transactionDescription, merchantList, matchType);
        addDescriptionPatternToMap(transactionId, normalizedKeyword);
        return descriptionPattern;
//        switch(matchType)
//        {
//            case EXACT ->
//            {
//                return transactionDescription.replaceAll(SPACE_KEY, BLANK_KEY).trim();
//            }
//            case CONTAINS ->
//            {
//                log.info("NormalizedKeyword: {}", normalizedKeyword);
//                boolean keywordMatchesOnMerchants = merchantList.stream()
//                        .map(m -> m.toUpperCase().replaceAll(SPACE_KEY, BLANK_KEY))
//                        .anyMatch(m -> m.equals(normalizedKeyword));
//                log.info("Keyword matches on merchants: " + keywordMatchesOnMerchants);
//                if(normalizedDescription.contains(normalizedKeyword) && keywordMatchesOnMerchants)
//                {
//                    return normalizedKeyword;
//                }
//                else
//                {
//                    // Look for spaces in the transaction description that occur where the keyword is
//                    return transactionDescription;
//                }
//            }
//            case WILDCARD -> {
//                StringBuilder wildCardPattern = new StringBuilder();
//                if(normalizedDescription.contains(normalizedKeyword)){
//                    return wildCardPattern.append(normalizedKeyword).append(WILDCARD_KEY).toString();
//                }
//
//                transactionDescriptionPatternMap.putIfAbsent(transactionId, wildCardPattern.toString());
//                return !wildCardPattern.isEmpty() ? wildCardPattern.toString() : normalizedDescription;
//            }
//            case MULTI_MERCHANT -> {
//                StringBuilder multiMerchantPattern = new StringBuilder();
//                for (String merchant : merchantList) {
//                    String normalizedMerchant = merchant.toUpperCase().trim();
//                    if (normalizedDescription.contains(normalizedMerchant)) {
//                        multiMerchantPattern.append(PIPE_KEY);
//                        multiMerchantPattern.append(normalizedMerchant);
//                    }
//                }
//                addDescriptionPatternToMap(transactionId, multiMerchantPattern.toString());
//                return !multiMerchantPattern.isEmpty() ? multiMerchantPattern.toString() : normalizedDescription;
//            }
//            case STARTS_WITH -> {
//                StringBuilder startsWithPattern = new StringBuilder();
//                if(normalizedDescription.startsWith(normalizedKeyword)){
//                    startsWithPattern.append(normalizedKeyword).append(START_KEY);
//                }
//
//                if(normalizedKeyword.isEmpty()){
//                    for(String merchant : merchantList){
//                        String normalizedMerchant = merchant.toUpperCase().trim();
//                        if(normalizedDescription.startsWith(normalizedMerchant)){
//                            startsWithPattern.append(START_KEY).append(normalizedMerchant);
//                        }
//                    }
//                }
//                addDescriptionPatternToMap(transactionId, startsWithPattern.toString());
//                return !startsWithPattern.isEmpty() ? startsWithPattern.toString() : normalizedDescription;
//            }
//        }
    }

    private String buildDescriptionPatternByMatchType(String descriptionKeyword, String description,
                                                      List<String> merchants, TransactionMatchType matchType) {

        String normalizedKeyword = descriptionKeyword.toUpperCase().trim();
        String normalizedDescription = description.toUpperCase().trim();
        StringBuilder pattern = new StringBuilder();

        switch(matchType) {
            case EXACT -> {
                pattern.append(INCLUDES_KEY)
                        .append(normalizedDescription)
                        .append(INCLUDES_KEY);
                return pattern.toString();
            }
            case CONTAINS -> {
                boolean matchesMerchant = merchants.stream()
                        .map(m -> m.toUpperCase().trim())
                        .anyMatch(m -> m.equals(normalizedKeyword));

                if(normalizedDescription.contains(normalizedKeyword) && matchesMerchant) {
                    pattern.append(normalizedKeyword);
                }
            }
            case WILDCARD -> {
                if(normalizedDescription.contains(normalizedKeyword)) {
                    pattern.append(normalizedKeyword)
                            .append(WILDCARD_KEY);
                } else {
                    for(String merchant : merchants) {
                        String normalizedMerchant = merchant.toUpperCase().trim();
                        if(normalizedDescription.contains(normalizedMerchant)) {
                            if(!pattern.isEmpty()) {
                                pattern.append(PIPE_KEY);
                            }
                            pattern.append(normalizedMerchant)
                                    .append(WILDCARD_KEY);
                        }
                    }
                }
            }
            case MULTI_MERCHANT -> {
                for(String merchant : merchants) {
                    String normalizedMerchant = merchant.toUpperCase().trim();
                    if(normalizedDescription.contains(normalizedMerchant)) {
                        if(!pattern.isEmpty()) {
                            pattern.append(PIPE_KEY);
                        }
                        pattern.append(normalizedMerchant);
                    }
                }
            }
            case STARTS_WITH -> {
                if(normalizedDescription.startsWith(normalizedKeyword)) {
                    pattern.append(START_KEY)
                            .append(normalizedKeyword);
                }
            }
        }

        return pattern.length() > 0 ? pattern.toString() : description;
    }

    private void addDescriptionPatternToMap(String transactionId, String descriptionPattern){
        transactionDescriptionPatternMap.putIfAbsent(transactionId, descriptionPattern);
    }

    public String buildDescriptionPattern(String transactionId, List<String> merchants, String transactionMerchantName, String keyword, String description, TransactionMatchType matchType) {
        return buildDescriptionPattern(transactionId, merchants, transactionMerchantName, keyword, description, matchType, null);
    }

    /**
     * Builds a merchant pattern that can match either single or multiple merchants
     * @param merchants List of merchant names to match
     * @return Pattern string for matching merchant(s)
     */
    public String buildMerchantPattern(final String transactionId, final List<String> merchants, final String merchantKeyword, final String transactionMerchantName, final String transactionDescription, final String categoryId, final TransactionMatchType matchType, final boolean useCategory) {
        if (merchants == null) {
            return "";
        }

        // If the merchant name is found to be null
        if(transactionMerchantName == null)
        {
            // Option 1: Match the merchant keyword by transaction description
            if(!transactionDescription.isEmpty() && !merchantKeyword.isEmpty())
            {
                return buildPatternByMatchType(merchants, transactionDescription, merchantKeyword, matchType);
            }
            // Option 2: Match the merchant keyword against a plaid category option
            if(!categoryId.isEmpty()) {
                CategoryEntity category = getCategoryById(categoryId);
                String categoryName = category.getName();
                String categoryDescription = category.getDescription();
                if (merchantKeyword.equalsIgnoreCase(categoryDescription)) {
                    return buildPatternByMatchType(merchants, categoryDescription, merchantKeyword, matchType);
                }
                if (merchantKeyword.equalsIgnoreCase(categoryName))
                {
                    return buildPatternByMatchType(merchants, categoryName, merchantKeyword, matchType);
                }
            }
        }
        else
        {
            return buildPatternByMatchType(merchants, transactionMerchantName, merchantKeyword, matchType);
        }
        return "";
    }

    private CategoryEntity getCategoryById(String categoryId)
    {
        if(categoryId == null || categoryId.isEmpty())
        {
            throw new CategoryNotFoundException("Category with id: " + categoryId + " Not found");
        }
        Optional<CategoryEntity> categoryEntityOptional = Optional.empty();
        CategoryEntity categoryEntity = null;
        try
        {
            categoryEntityOptional = categoryService.findCategoryById(categoryId);
            if(categoryEntityOptional.isPresent())
            {
                categoryEntity = categoryEntityOptional.get();
            }
            return categoryEntity;
        }catch(DataAccessException ex)
        {
            log.error("There was an error fetching the category: ", ex);
            return categoryEntityOptional.orElseThrow(() -> new CategoryNotFoundException("Category with id: " + categoryId + " Not found"));
        }
    }

    private String buildPatternByMatchType(final List<String> merchants, final String descriptionOrMerchant, final String keyword, final TransactionMatchType matchType) {
        StringBuilder pattern = new StringBuilder();
        String normalizedText = descriptionOrMerchant.toUpperCase().trim();
        String normalizedKeyword = keyword.toUpperCase().trim();
        switch(matchType) {
            case EXACT -> {
                // Case 1: Match on text contains keyword
                if (normalizedText.contains(normalizedKeyword)) {
                    pattern.append(normalizedKeyword);
                }
                // Case 2: Match on merchants list
                else if (!merchants.isEmpty()) {
                    merchants.stream()
                            .map(m -> m.toUpperCase().trim())
                            .filter(normalizedText::contains)
                            .findFirst()
                            .ifPresent(pattern::append);
                }
            }
            case WILDCARD -> {
                // Case 1: Match on text contains keyword
                if (normalizedText.contains(normalizedKeyword)) {
                    pattern.append(normalizedKeyword)
                            .append(WILDCARD_KEY);
                }
                // Case 2: Match on merchants list
                else if (!merchants.isEmpty()) {
                    merchants.stream()
                            .map(m -> m.toUpperCase().trim())
                            .filter(normalizedText::contains)
                            .findFirst()
                            .ifPresent(m -> pattern.append(m).append(WILDCARD_KEY));
                }
            }
            case CONTAINS -> {
                // Case 1: Match on text contains keyword
                if (normalizedText.contains(normalizedKeyword)) {
                    pattern.append(INCLUDES_KEY)
                            .append(normalizedKeyword)
                            .append(INCLUDES_KEY);
                }
                // Case 2: Match on merchants list
                else if (!merchants.isEmpty()) {
                    merchants.stream()
                            .map(m -> m.toUpperCase().trim())
                            .filter(normalizedText::contains)
                            .findFirst()
                            .ifPresent(m -> pattern.append(INCLUDES_KEY)
                                    .append(m)
                                    .append(INCLUDES_KEY));
                }
            }
            case STARTS_WITH -> {
                // Case 1: Match on text starts with keyword
                if (normalizedText.startsWith(normalizedKeyword)) {
                    pattern.append(START_KEY)
                            .append(normalizedKeyword);
                }
                // Case 2: Match on merchants list
                else if (!merchants.isEmpty()) {
                    merchants.stream()
                            .map(m -> m.toUpperCase().trim())
                            .filter(normalizedText::startsWith)
                            .findFirst()
                            .ifPresent(m -> pattern.append(START_KEY).append(m));
                }
            }
            case MULTI_MERCHANT -> {
                if(!merchants.isEmpty()) {
                    merchants.forEach(m -> {
                        if(pattern.length() > 0) {
                            pattern.append(PIPE_KEY);
                        }
                        pattern.append(m.toUpperCase().trim());
                    });
                }
            }
        }

        return pattern.length() > 0 ? pattern.toString() : "";
    }
    }


}
