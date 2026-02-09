package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidCategory;
import com.app.budgetbuddy.entities.CategoryEntity;
import org.springframework.stereotype.Component;

@Component
public class PlaidCategoryToEntityConverter implements Converter<PlaidCategory, CategoryEntity>
{

    @Override
    public CategoryEntity convert(PlaidCategory plaidCategory)
    {
        return null;
    }
}
