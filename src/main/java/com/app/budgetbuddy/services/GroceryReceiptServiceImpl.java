package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.GroceryReceiptEntity;
import com.app.budgetbuddy.repositories.GroceryReceiptRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class GroceryReceiptServiceImpl implements GroceryReceiptService
{
    private final GroceryReceiptRepository groceryReceiptRepository;

    @Autowired
    public GroceryReceiptServiceImpl(GroceryReceiptRepository groceryReceiptRepository)
    {
        this.groceryReceiptRepository = groceryReceiptRepository;
    }

    @Override
    public Collection<GroceryReceiptEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(GroceryReceiptEntity groceryReceiptEntity) {

    }

    @Override
    public void delete(GroceryReceiptEntity groceryReceiptEntity) {

    }

    @Override
    public Optional<GroceryReceiptEntity> findById(Long id) {
        return Optional.empty();
    }
}
