package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;

import java.util.List;

public interface BPCategoryService extends ServiceModel<BPCategoryEntity>
{
    void saveModel(BPCategory budgetCategory);

    List<BPCategoryEntity> saveCategories(List<BPGridRow> rows, List<BPColumnEntity> columnEntities);
    List<BPCategory> getCategoriesByTemplateDetailId(Long templateDetailId);
    void saveCategories(List<BPCategory> categories);
    void deleteCategoriesByDetailEntity(BPTemplateDetailEntity detail);
    void updateCategories(List<BPCategory> categories);
    void updateCategoryPlannedAmounts(List<BPCategory> categories);
    void saveNewTemplateCategories(List<BPCategory> categories, Long templateDetailId);
    List<BPCategory> updateBPCategoriesByFutureAmounts(DateRange dateRange, Long userId, List<FuturePeriodCategories> futurePeriodCategories);
}
