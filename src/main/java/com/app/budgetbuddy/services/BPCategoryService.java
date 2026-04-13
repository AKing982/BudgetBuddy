package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.domain.BPGridRow;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;

import java.util.List;

public interface BPCategoryService extends ServiceModel<BPCategoryEntity>
{
    void saveModel(BPCategory budgetCategory);

    List<BPCategoryEntity> saveCategories(List<BPGridRow> rows, List<BPColumnEntity> columnEntities);
    void saveCategories(List<BPCategory> categories);
}
