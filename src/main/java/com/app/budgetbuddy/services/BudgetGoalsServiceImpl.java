package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetGoalsRequest;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.repositories.BudgetGoalsRepository;
import com.app.budgetbuddy.repositories.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetGoalsServiceImpl implements BudgetGoalsService
{
    private final BudgetGoalsRepository budgetGoalsRepository;
    private final BudgetRepository budgetRepository;

    @Autowired
    public BudgetGoalsServiceImpl(BudgetGoalsRepository budgetGoalsRepository,
                                  BudgetRepository budgetRepository){
        this.budgetGoalsRepository = budgetGoalsRepository;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<BudgetGoalsEntity> findAll() {
        return budgetGoalsRepository.findAll();
    }

    @Override
    public void save(BudgetGoalsEntity budgetGoalsEntity) {
        budgetGoalsRepository.save(budgetGoalsEntity);
    }

    @Override
    public void delete(BudgetGoalsEntity budgetGoalsEntity) {
        budgetGoalsRepository.delete(budgetGoalsEntity);
    }

    @Override
    public Optional<BudgetGoalsEntity> findById(Long id) {
        return budgetGoalsRepository.findById(id);
    }

    @Override
    public BudgetGoalsEntity createAndSaveBudgetGoal(BudgetGoalsRequest budgetGoalsRequest) {
        BudgetGoalsEntity budgetGoalsEntity = new BudgetGoalsEntity();
        budgetGoalsEntity.setBudget(findBudgetById(budgetGoalsRequest.budgetId()));
        budgetGoalsEntity.setGoalDescription(budgetGoalsRequest.goalDescription());
        budgetGoalsEntity.setGoalType(budgetGoalsRequest.goalType());
        budgetGoalsEntity.setGoalName(budgetGoalsRequest.goalName());
        budgetGoalsEntity.setCurrentSavings(budgetGoalsRequest.currentSavings());
        budgetGoalsEntity.setMonthlyAllocation(budgetGoalsRequest.monthlyAllocation());
        budgetGoalsEntity.setSavingsFrequency(budgetGoalsRequest.savingsFrequency());
        budgetGoalsEntity.setTargetAmount(budgetGoalsRequest.targetAmount());
        budgetGoalsEntity.setStatus(budgetGoalsRequest.status());
        budgetGoalsEntity.setCreatedAt(LocalDateTime.now());
        budgetGoalsEntity.setUpdatedAt(null);
        return budgetGoalsRepository.save(budgetGoalsEntity);
    }

    private BudgetEntity findBudgetById(Long budgetId){
        if(budgetId == null){
            return null;
        }

        Optional<BudgetEntity> budgetEntity = budgetRepository.findById(budgetId);
        return budgetEntity.orElse(null);
    }

}
