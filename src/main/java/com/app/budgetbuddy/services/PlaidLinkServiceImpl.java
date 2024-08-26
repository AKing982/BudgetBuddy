package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.repositories.PlaidLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class PlaidLinkServiceImpl implements PlaidLinkService
{
    private final PlaidLinkRepository plaidLinkRepository;

    @Autowired
    public PlaidLinkServiceImpl(PlaidLinkRepository plaidLinkRepository){
        this.plaidLinkRepository = plaidLinkRepository;
    }

    @Override
    public Collection<PlaidLinkEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(PlaidLinkEntity plaidLinkEntity) {

    }

    @Override
    public void delete(PlaidLinkEntity plaidLinkEntity) {

    }

    @Override
    public Optional<PlaidLinkEntity> findById(Long id) {
        return Optional.empty();
    }
}
