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
    private static final String WILDCARD_KEY = ".*";
    private static final String SPACE_KEY = "\\s+";
    private static final String BLANK_KEY = " ";
    private static final String PIPE_KEY = "|";
    private static final String START_KEY = "^";
    private static final String CONTAINS_KEY = ".";
    private static final String INCLUDES_KEY = "%";

    public static String buildPattern(String text, String keyword, TransactionMatchType matchType){
        if (text == null || keyword == null || text.isEmpty() || keyword.isEmpty()) {
            return "";
        }

        String normalizedText = text.toUpperCase().trim();
        String normalizedKeyword = keyword.toUpperCase().trim();

        // First verify keyword exists in text
        if (!normalizedText.contains(normalizedKeyword)) {
            return ""; // No match found
        }

        return switch(matchType) {
            case EXACT -> {
                // Only return if exact match
                yield normalizedText.equals(normalizedKeyword) ? normalizedKeyword : "";
            }
            case CONTAINS -> {
                // Keyword found anywhere in text
                yield INCLUDES_KEY + normalizedKeyword + INCLUDES_KEY;
            }
            case WILDCARD -> {
                // Keyword found with anything after
                yield normalizedKeyword + WILDCARD_KEY;
            }
            case STARTS_WITH -> // Only if text starts with keyword
                    normalizedText.startsWith(normalizedKeyword) ?
                            START_KEY + normalizedKeyword : "";
        };
    }


}
