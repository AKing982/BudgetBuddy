package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.PlaidCategories;
import com.app.budgetbuddy.domain.PlaidCategory;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Getter
@Component
@Slf4j
public class PlaidCategoryManager
{
    private static final Map<String, PlaidCategory> categories = new HashMap<>();

    static {
        for (PlaidCategories category : PlaidCategories.values()) {
            categories.put(category.name(), new PlaidCategory(category.getPrimaryCategory(), category.getSecondaryCategory()));
        }
        log.info("Loaded {} plaid categories", categories.size());
    }

    public static void addCategory(String name, String primaryCategory, String secondaryCategory) {
        categories.put(name.toUpperCase(), new PlaidCategory(primaryCategory, secondaryCategory));
    }

    public PlaidCategory getCategory(String name) {
        log.info("Category: {}", name);
        PlaidCategory plaidCategory = categories.get(name);
        log.info("Plaid category: {}", plaidCategory);
        return plaidCategory;
    }

}
