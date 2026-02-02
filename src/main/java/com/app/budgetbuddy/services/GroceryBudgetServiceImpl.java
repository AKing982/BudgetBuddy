package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.GroceryBudgetEntity;
import com.app.budgetbuddy.repositories.GroceryBudgetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class GroceryBudgetServiceImpl implements GroceryBudgetService
{
    private final GroceryBudgetRepository groceryBudgetRepository;

    @Autowired
    public GroceryBudgetServiceImpl(GroceryBudgetRepository groceryBudgetRepository)
    {
        this.groceryBudgetRepository = groceryBudgetRepository;
    }

    @Override
    public Collection<GroceryBudgetEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(GroceryBudgetEntity groceryBudgetEntity) {

    }

    @Override
    public void delete(GroceryBudgetEntity groceryBudgetEntity) {

    }

    @Override
    public Optional<GroceryBudgetEntity> findById(Long id) {
        return Optional.empty();
    }
}
