package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.ControlledBudgetCategory;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.ControlledSpendingCategoryEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import com.app.budgetbuddy.repositories.ControlledSpendingCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class ControlledSpendingCategoriesServiceImpl implements ControlledSpendingCategoriesService
{
    private final ControlledSpendingCategoryRepository budgetCategoriesRepository;
    private final BudgetRepository budgetRepository;

    @Autowired
    public ControlledSpendingCategoriesServiceImpl(ControlledSpendingCategoryRepository budgetCategoriesRepository,
                                       BudgetRepository budgetRepository){
        this.budgetCategoriesRepository = budgetCategoriesRepository;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<ControlledSpendingCategoryEntity> findAll() {
        return budgetCategoriesRepository.findAll();
    }

    @Override
    public void save(ControlledSpendingCategoryEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.save(budgetCategoriesEntity);
    }

    @Override
    public void delete(ControlledSpendingCategoryEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.delete(budgetCategoriesEntity);
    }

    @Override
    public Optional<ControlledSpendingCategoryEntity> findById(Long id) {
        return budgetCategoriesRepository.findById(id);
    }

    @Override
    public ControlledSpendingCategoryEntity createAndSaveBudgetCategory(ControlledBudgetCategory budgetCategory) {
       ControlledSpendingCategoryEntity budgetCategoriesEntity = new ControlledSpendingCategoryEntity();
       budgetCategoriesEntity.setCategoryName(budgetCategory.categoryName());
       budgetCategoriesEntity.setCurrentSpending(budgetCategory.currentSpending());
       budgetCategoriesEntity.setIsActive(budgetCategory.isActive());
       budgetCategoriesEntity.setIsFixedExpense(budgetCategory.isFixedExpense());
       budgetCategoriesEntity.setMonthlySpendingLimit(budgetCategory.monthlySpendingLimit());
       budgetCategoriesEntity.setPriority(budgetCategory.priority());
       budgetCategoriesEntity.setAllocatedAmount(budgetCategory.allocatedAmount());
       budgetCategoriesEntity.setBudget(findBudgetEntityByBudgetId(budgetCategory.budgetId()));
       budgetCategoriesEntity.setCreatedAt(LocalDateTime.now());
       budgetCategoriesEntity.setUpdatedAt(LocalDateTime.now());
       return budgetCategoriesRepository.save(budgetCategoriesEntity);
    }

    @Override
    public List<ControlledSpendingCategoryEntity> findByBudgetId(Long budgetId) {
        return budgetCategoriesRepository.findAllByBudgetId(budgetId);
    }

    private BudgetEntity findBudgetEntityByBudgetId(Long budgetId) {
        if (budgetId == null) {
            return null;
        }
        Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(budgetId);
        return budgetEntityOptional.orElse(null);
    }
}
