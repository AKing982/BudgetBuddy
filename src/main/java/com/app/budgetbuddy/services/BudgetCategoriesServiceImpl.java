package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.repositories.BudgetCategoriesRepository;
import com.app.budgetbuddy.repositories.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
public class BudgetCategoriesServiceImpl implements BudgetCategoriesService
{
    private final BudgetCategoriesRepository budgetCategoriesRepository;
    private final BudgetRepository budgetRepository;

    @Autowired
    public BudgetCategoriesServiceImpl(BudgetCategoriesRepository budgetCategoriesRepository,
                                       BudgetRepository budgetRepository){
        this.budgetCategoriesRepository = budgetCategoriesRepository;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<BudgetCategoriesEntity> findAll() {
        return budgetCategoriesRepository.findAll();
    }

    @Override
    public void save(BudgetCategoriesEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.save(budgetCategoriesEntity);
    }

    @Override
    public void delete(BudgetCategoriesEntity budgetCategoriesEntity) {
        budgetCategoriesRepository.delete(budgetCategoriesEntity);
    }

    @Override
    public Optional<BudgetCategoriesEntity> findById(Long id) {
        return budgetCategoriesRepository.findById(id);
    }

    @Override
    public BudgetCategoriesEntity createAndSaveBudgetCategory(BudgetCategory budgetCategory) {
       BudgetCategoriesEntity budgetCategoriesEntity = new BudgetCategoriesEntity();
       budgetCategoriesEntity.setCategoryName(budgetCategory.categoryName());
       budgetCategoriesEntity.setCurrentSpending(budgetCategory.currentSpending());
       budgetCategoriesEntity.setIsActive(budgetCategory.isActive());
       budgetCategoriesEntity.setIsFixedExpense(budgetCategory.isFixedExpense());
       budgetCategoriesEntity.setMonthlySpendingLimit(budgetCategory.monthlySpendingLimit());
       budgetCategoriesEntity.setPriority(budgetCategory.priority());
       budgetCategoriesEntity.setBudget(findBudgetEntityByBudgetId(budgetCategory.budgetId()));
       return budgetCategoriesRepository.save(budgetCategoriesEntity);
    }

    private BudgetEntity findBudgetEntityByBudgetId(Long budgetId) {
        if (budgetId == null) {
            return null;
        }
        Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(budgetId);
        return budgetEntityOptional.orElse(null);
    }
}
