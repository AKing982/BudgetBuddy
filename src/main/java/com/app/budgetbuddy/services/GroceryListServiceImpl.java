package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.GroceryListEntity;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class GroceryListServiceImpl implements GroceryListService
{

    @Override
    public Collection<GroceryListEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(GroceryListEntity groceryListEntity) {

    }

    @Override
    public void delete(GroceryListEntity groceryListEntity) {

    }

    @Override
    public Optional<GroceryListEntity> findById(Long id) {
        return Optional.empty();
    }
}
