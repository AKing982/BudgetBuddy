package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PreCalculationCategory;
import com.app.budgetbuddy.entities.PreCalculationCategoryEntity;

import java.util.Optional;

public interface PreCalculationCategoryService extends ServiceModel<PreCalculationCategoryEntity>
{
    Optional<PreCalculationCategoryEntity> createPreCalculationCategoryEntity(PreCalculationCategory preCalculationCategory);
}
