package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.repositories.BudgetCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetCategoryServiceImpl implements BudgetCategoryService
{
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final BudgetCategoryConverter transactionCategoryConverter;

    @Autowired
    public BudgetCategoryServiceImpl(BudgetCategoryRepository budgetCategoryRepository,
                                          BudgetCategoryConverter transactionCategoryConverter)
    {
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionCategoryConverter = transactionCategoryConverter;
    }

    @Override
    public Collection<BudgetCategoryEntity> findAll() {
        return budgetCategoryRepository.findAll();
    }

    @Override
    public void save(BudgetCategoryEntity userBudgetCategoryEntity) {
        budgetCategoryRepository.save(userBudgetCategoryEntity);
    }

    @Override
    public void delete(BudgetCategoryEntity userBudgetCategoryEntity) {
        budgetCategoryRepository.delete(userBudgetCategoryEntity);
    }

    @Override
    public Optional<BudgetCategoryEntity> findById(Long id) {
        return Optional.empty();
    }


    @Override
    public List<BudgetCategoryEntity> getAllBudgetCategoriesByUser(Long userId)
    {
        return budgetCategoryRepository.findAllByUserId(userId);
    }

    @Override
    public List<BudgetCategoryEntity> getActiveBudgetCategoriesByUser(Long userId)
    {
        return budgetCategoryRepository.findActiveCategoriesByUser(userId);
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId) {
        return budgetCategoryRepository.findByBudgetId(budgetId);
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return budgetCategoryRepository.findByBudgetIdAndDateRange(budgetId, startDate, endDate);
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getBudgetCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        List<BudgetCategoryEntity> budgetCategoryEntities = budgetCategoryRepository.findByBudgetIdAndDateRange(budgetId, startDate, endDate);
        List<BudgetCategory> transactionCategoryList = new ArrayList<>();
        for(BudgetCategoryEntity budgetCategoryEntity : budgetCategoryEntities){
            BudgetCategory budgetCategory = new BudgetCategory();
            budgetCategory.setId(budgetCategoryEntity.getId());
            budgetCategory.setCategoryId(budgetCategoryEntity.getCategory().getId());
            budgetCategory.setSubBudgetId(budgetCategoryEntity.getSubBudget().getId());
            budgetCategory.setCategoryName(budgetCategoryEntity.getCategory().getName());
            budgetCategory.setBudgetedAmount(budgetCategoryEntity.getBudgetedAmount());
            budgetCategory.setBudgetActual(budgetCategoryEntity.getActual());
            budgetCategory.setEndDate(budgetCategoryEntity.getEndDate());
            budgetCategory.setStartDate(budgetCategoryEntity.getStartDate());
            budgetCategory.setIsActive(budgetCategoryEntity.getIsactive());
            budgetCategory.setOverSpendingAmount(budgetCategoryEntity.getOverspendingAmount());
            // Fix the isOverSpent handling
            budgetCategory.setOverSpent(
                    budgetCategoryEntity.getIsOverSpent() != null ?
                            budgetCategoryEntity.getIsOverSpent() :
                            false
            );
            transactionCategoryList.add(budgetCategory);
        }
        return transactionCategoryList;
    }

    @Override
    public Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return budgetCategoryRepository.sumBudgetedAmountByUserAndDateRange(userId, startDate, endDate);
    }
}

