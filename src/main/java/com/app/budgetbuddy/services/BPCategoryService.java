package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.entities.BPCategoryEntity;

import java.util.List;

public interface BPCategoryService extends ServiceModel<BPCategoryEntity>
{
    void saveModel(BPCategory budgetCategory);

    void saveCategories(List<BPCategory> categories);
}
