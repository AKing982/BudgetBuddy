package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCategoryGroupEntity;
import com.app.budgetbuddy.repositories.BPCategoryGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPCategoryGroupServiceImpl implements BPCategoryGroupService
{
    private final BPCategoryGroupRepository bpCategoryGroupRepository;

    @Autowired
    public BPCategoryGroupServiceImpl(BPCategoryGroupRepository bpCategoryGroupRepository)
    {
        this.bpCategoryGroupRepository = bpCategoryGroupRepository;
    }

    @Override
    public Collection<BPCategoryGroupEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPCategoryGroupEntity bpCategoryGroupEntity) {

    }

    @Override
    public void delete(BPCategoryGroupEntity bpCategoryGroupEntity) {

    }

    @Override
    public Optional<BPCategoryGroupEntity> findById(Long id) {
        return Optional.empty();
    }
}
