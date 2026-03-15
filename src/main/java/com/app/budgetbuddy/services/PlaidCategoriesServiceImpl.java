package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.PlaidCategoriesRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class PlaidCategoriesServiceImpl implements PlaidCategoriesService
{
    private final PlaidCategoriesRepository plaidCategoriesRepository;

    @Autowired
    public PlaidCategoriesServiceImpl(PlaidCategoriesRepository plaidCategoriesRepository)
    {
        this.plaidCategoriesRepository = plaidCategoriesRepository;
    }

    @Override
    public Collection<PlaidCategoriesEntity> findAll()
    {
        try
        {
            return plaidCategoriesRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the Plaid Categories", e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public void save(PlaidCategoriesEntity plaidCategoriesEntity) {
        try
        {
            plaidCategoriesRepository.save(plaidCategoriesEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the Plaid Categories: ", e);
            throw new DataAccessException("There was an error saving the Plaid Categories", e);
        }
    }

    @Override
    @Transactional
    public void delete(PlaidCategoriesEntity plaidCategoriesEntity)
    {
        try
        {
            plaidCategoriesRepository.delete(plaidCategoriesEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the Plaid Categories: ", e);
            throw new DataAccessException("There was an error deleting the Plaid Categories", e);
        }
    }

    @Override
    public Optional<PlaidCategoriesEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidFull(String categoryId, String primary, String secondary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidFull(categoryId, primary, secondary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidPrimaryAndSecondary(String primary, String secondary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidPrimaryAndSecondary(primary, secondary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }

    }

    @Override
    public Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndSecondary(String categoryId, String secondary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidCategoryIdAndSecondary(categoryId, secondary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidCategoryIdAndPrimary(String categoryId, String primary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidCategoryIdAndPrimary(categoryId, primary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidPrimaryOnly(String primary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidPrimaryOnly(primary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidSecondaryOnly(String secondary)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidSecondaryOnly(secondary);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }

    }

    @Override
    @Transactional
    public Optional<PlaidCategoriesEntity> findByPlaidCategoryIdOnly(String categoryId)
    {
        try
        {
            return plaidCategoriesRepository.findByPlaidCategoryIdOnly(categoryId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the Plaid Categories: ", e);
            return Optional.empty();
        }
    }
}
