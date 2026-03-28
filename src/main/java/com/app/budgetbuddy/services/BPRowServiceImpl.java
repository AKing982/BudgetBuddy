package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPRowEntity;
import com.app.budgetbuddy.repositories.BPRowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPRowServiceImpl implements BPRowService
{
    private final BPRowRepository bpRowRepository;

    @Autowired
    public BPRowServiceImpl(BPRowRepository bpRowRepository)
    {
        this.bpRowRepository = bpRowRepository;
    }

    @Override
    public Collection<BPRowEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPRowEntity bpRowEntity) {

    }

    @Override
    public void delete(BPRowEntity bpRowEntity) {

    }

    @Override
    public Optional<BPRowEntity> findById(Long id) {
        return Optional.empty();
    }
}
