package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.UserCategoryRule;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.CategoryRuleEntity;
import com.app.budgetbuddy.services.CategoryService;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Getter
@Setter
public abstract class AbstractTransactionMatcher<T extends Transaction> implements TransactionMatcher<T> {
    protected final CategoryRuleService categoryRuleService;
    protected final CategoryService categoryService;
    protected List<CategoryRule> systemCategoryRules = new ArrayList<>();
    protected List<UserCategoryRule> userCategoryRules;
    private Logger LOGGER = LoggerFactory.getLogger(AbstractTransactionMatcher.class);

    public AbstractTransactionMatcher(CategoryRuleService categoryRuleService, CategoryService categoryService) {
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.systemCategoryRules = loadCategoryRules();
    }

    protected List<CategoryRule> loadCategoryRules(){
        return categoryRuleService.getConvertedCategoryRules(
                categoryRuleService.findAllSystemCategoryRules()
        );
    }

    protected void loadUserCategoryRules(Long userId)
    {
        List<CategoryRuleEntity> categoryRuleEntities = categoryRuleService.findByUserId(userId);
        if(!categoryRuleEntities.isEmpty()) {
            List<CategoryRule> categoryRulesForUser = categoryRuleService.getConvertedCategoryRules(categoryRuleEntities);
            if(!categoryRulesForUser.isEmpty()) {
                this.systemCategoryRules.addAll(categoryRulesForUser);
            }
        }

    }

    protected abstract Boolean matchesRule(T transaction, CategoryRule categoryRule);

    protected String getCategoryNameById(String categoryId) {
        if (categoryId == null) {
            return "";
        }
        Optional<CategoryEntity> category = categoryService.findCategoryById(categoryId);
        LOGGER.info("Found Category: " + category);
        return category.isPresent() ? category.get().getName() : "";
    }
}
