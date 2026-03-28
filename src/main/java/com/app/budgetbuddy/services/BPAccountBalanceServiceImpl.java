package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPAccountBalanceEntity;
import com.app.budgetbuddy.repositories.BPAccountBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPAccountBalanceServiceImpl implements BPAccountBalanceService
{
    private final BPAccountBalanceRepository bpAccountBalanceRepository;

    @Autowired
    public BPAccountBalanceServiceImpl(BPAccountBalanceRepository bpAccountBalanceRepository)
    {
        this.bpAccountBalanceRepository = bpAccountBalanceRepository;
    }

    @Override
    public Collection<BPAccountBalanceEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPAccountBalanceEntity bpAccountBalanceEntity) {

    }

    @Override
    public void delete(BPAccountBalanceEntity bpAccountBalanceEntity) {

    }

    @Override
    public Optional<BPAccountBalanceEntity> findById(Long id) {
        return Optional.empty();
    }
}
