package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.PlaidCategories;

import java.util.HashMap;
import java.util.Map;

public class PlaidCategoryManager
{
    private static final Map<String, PlaidCategory> categories = new HashMap<>();

    static {
//        for (PlaidCategories category : PlaidCategories.values()) {
//            categories.put(category.name(), new PlaidCategory(category.primaryCategory, category.secondaryCategory));
//        }
    }

    public static void addCategory(String name, String primaryCategory, String secondaryCategory) {
        categories.put(name.toUpperCase(), new PlaidCategory(primaryCategory, secondaryCategory));
    }

    public static PlaidCategory getCategory(String name) {
        return categories.get(name.toUpperCase());
    }

    public static class PlaidCategory {
        private final String primaryCategory;
        private final String secondaryCategory;

        public PlaidCategory(String primaryCategory, String secondaryCategory) {
            this.primaryCategory = primaryCategory;
            this.secondaryCategory = secondaryCategory;
        }

        public String getPrimaryCategory() {
            return primaryCategory;
        }

        public String getSecondaryCategory() {
            return secondaryCategory;
        }
    }
}
