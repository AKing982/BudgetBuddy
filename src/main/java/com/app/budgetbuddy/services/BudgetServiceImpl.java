package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.domain.User;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetServiceImpl implements BudgetService
{
    private final BudgetRepository budgetRepository;

    @Autowired
    public BudgetServiceImpl(BudgetRepository budgetRepository){
        this.budgetRepository = budgetRepository;
    }

    @Override
    public Collection<BudgetEntity> findAll() {
        return budgetRepository.findAll();
    }

    @Override
    public void save(BudgetEntity budgetEntity) {
        budgetRepository.save(budgetEntity);
    }

    @Override
    public void delete(BudgetEntity budgetEntity) {
        budgetRepository.delete(budgetEntity);
    }

    @Override
    public Optional<BudgetEntity> findById(Long id) {
        return budgetRepository.findById(id);
    }

    @Override
    public Budget loadUserBudget(Long userId) {
        Optional<BudgetEntity> budgetEntityOptional = budgetRepository.findById(userId);
        if (budgetEntityOptional.isEmpty()) {
            throw new RuntimeException("Budget not found");
        }
        BudgetEntity budgetEntity = budgetEntityOptional.get();
        return convertBudgetEntity(budgetEntity);
    }

    private Budget convertBudgetEntity(BudgetEntity budgetEntity) {
        if(budgetEntity == null) {
            return null;
        }
        Budget budget = new Budget();
        budget.setId(budgetEntity.getId());
        budget.setUserId(budgetEntity.getUser().getId());
        budget.setActual(null);
        budget.setBudgetAmount(budgetEntity.getBudgetAmount());
        budget.setBudgetName(budgetEntity.getBudgetName());
        budget.setBudgetDescription(budgetEntity.getBudgetDescription());
        budget.setStartDate(budgetEntity.getStartDate());
        budget.setEndDate(budgetEntity.getEndDate());
        return budget;
    }

    @Override
    public BudgetEntity createAndSaveBudget(BudgetCreateRequest createRequest) {
        BudgetEntity budgetEntity = new BudgetEntity();
        budgetEntity.setUser(UserEntity.builder().id(createRequest.userId()).build());
        budgetEntity.setBudgetAmount(createRequest.budgetAmount());
        budgetEntity.setBudgetDescription(createRequest.budgetDescription());
        budgetEntity.setBudgetName(createRequest.budgetName());
        budgetEntity.setEndDate(createRequest.endDate());
        budgetEntity.setStartDate(createRequest.startDate());
        budgetEntity.setCreatedDate(LocalDateTime.now());
        budgetEntity.setMonthlyIncome(createRequest.monthlyIncome());
        budgetEntity.setLastUpdatedDate(null);
        return budgetRepository.save(budgetEntity);
    }

    @Override
    public List<BudgetEntity> getBudgetByUserId(Long id) {
        return budgetRepository.findByUser(id);
    }

    @Override
    public BigDecimal calculateTotalSpent(Long budgetId) {
        return null;
    }

    @Override
    public BigDecimal calculateRemainingBudget(Long budgetId) {
        return null;
    }

    @Override
    public Optional<BudgetEntity> updateBudget(Long id, BudgetCreateRequest updateRequest) {
        return Optional.empty();
    }
}
