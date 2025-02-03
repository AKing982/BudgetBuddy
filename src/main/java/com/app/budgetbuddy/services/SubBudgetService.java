package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.SubBudgetEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubBudgetService extends ServiceModel<SubBudgetEntity>
{
    List<SubBudget> getSubBudgetsByUserIdAndDate(Long userId, LocalDate startDate, LocalDate endDate);
    Optional<SubBudgetEntity> saveSubBudget(SubBudget subBudget);

}
