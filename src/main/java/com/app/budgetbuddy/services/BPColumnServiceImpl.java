package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.repositories.BPColumnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPColumnServiceImpl implements BPColumnService
{
    private final BPColumnRepository bpColumnRepository;

    @Autowired
    public BPColumnServiceImpl(BPColumnRepository bpColumnRepository)
    {
        this.bpColumnRepository = bpColumnRepository;
    }

    @Override
    public Collection<BPColumnEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPColumnEntity bpColumnEntity) {

    }

    @Override
    public void delete(BPColumnEntity bpColumnEntity) {

    }

    @Override
    public Optional<BPColumnEntity> findById(Long id) {
        return Optional.empty();
    }
}
