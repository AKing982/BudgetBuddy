//package com.app.budgetbuddy.workbench.categories;
//
//import com.app.budgetbuddy.domain.CategoryRule;
//import com.app.budgetbuddy.domain.UserCategoryRule;
//import org.springframework.stereotype.Service;
//
//import java.lang.reflect.MalformedParameterizedTypeException;
//import java.util.ArrayList;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//@Service
//public class CategoryRulePrioritizer<T extends CategoryRule> {
//
//    private Map<Integer, List<CategoryRule>> categoryRulePriorityMap = new HashMap<>();
//    private Map<Integer, List<UserCategoryRule>> userCategoryRulePriorityMap = new HashMap<>();
//
//    public void setCategoryRulePriority(int priority, CategoryRule categoryRule) {
//        categoryRulePriorityMap
//                .computeIfAbsent(priority, k -> new ArrayList<>())
//                .add(categoryRule);
//    }
//
//
//    public CategoryRule findHighestPriorityRule(List<T> categoryRules) {
//        for (int priority = 1; priority <= categoryRulePriorityMap.size(); priority++)
//        {
//            List<CategoryRule> rulesAtPriority = categoryRulePriorityMap.get(priority);
//            if (rulesAtPriority != null)
//            {
//                for (T rule : categoryRules)
//                {
//                    if (rulesAtPriority.contains(rule))
//                    {
//                        return rule;
//                    }
//                }
//            }
//        }
//        return null;
//    }
//
//    public int compareRulePriority(T rule1, T rule2) {
//        int priority1 = getRulePriority(rule1);
//        int priority2 = getRulePriority(rule2);
//        return Integer.compare(priority1, priority2);
//    }
//
//    private int getRulePriority(T rule)
//    {
//        return categoryRulePriorityMap.entrySet()
//                .stream()
//                .filter(entry -> entry.getValue().contains(rule))
//                .map(Map.Entry::getKey)
//                .findFirst()
//                .orElse(Integer.MAX_VALUE);
//    }
//
//    public void setUserCategoryRulePriority(int priority, UserCategoryRule userCategoryRule) {
//        userCategoryRulePriorityMap
//                .computeIfAbsent(priority, k -> new ArrayList<>())
//                .add(userCategoryRule);
//    }
//}
