package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCellEntity;
import com.app.budgetbuddy.repositories.BPCellRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPCellServiceImpl implements BPCellService
{
    private final BPCellRepository bpCellRepository;

    @Autowired
    public BPCellServiceImpl(BPCellRepository bpCellRepository)
    {
        this.bpCellRepository = bpCellRepository;
    }

    @Override
    public Collection<BPCellEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPCellEntity bpCellEntity) {

    }

    @Override
    public void delete(BPCellEntity bpCellEntity) {

    }

    @Override
    public Optional<BPCellEntity> findById(Long id) {
        return Optional.empty();
    }
}
