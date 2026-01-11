package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.SubBudgetEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubBudgetService extends ServiceModel<SubBudgetEntity>
{
    Optional<SubBudget> getSubBudgetsByUserIdAndDate(Long userId, LocalDate startDate, LocalDate endDate);
    Optional<SubBudgetEntity> saveSubBudget(SubBudget subBudget);
    Optional<SubBudget> findSubBudgetById(Long id);
    Optional<SubBudget> findSubBudgetByUserIdAndDate(Long userId, LocalDate date);
    Optional<SubBudgetEntity> updateSubBudget(SubBudget subBudget);
    Optional<SubBudget> findSubBudgetByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
    List<SubBudget> findSubBudgetsByUserId(Long userId);
    Optional<SubBudget> updateSubBudgetSpendingByDateRange(Long subBudgetId, LocalDate startDate, LocalDate endDate);
    List<SubBudget> findSubBudgetsByUserIdAndLimit(Long userId, int numOfMonths, int year);

}
