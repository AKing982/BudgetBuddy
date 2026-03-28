package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCategoryGroupMemberEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPCategoryGroupMemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPCategoryGroupMemberServiceImpl implements BPCategoryGroupMemberService
{
    private final BPCategoryGroupMemberRepository bpCategoryGroupMemberRepository;

    @Autowired
    public BPCategoryGroupMemberServiceImpl(BPCategoryGroupMemberRepository bpCategoryGroupMemberRepository)
    {
        this.bpCategoryGroupMemberRepository = bpCategoryGroupMemberRepository;
    }

    @Override
    @Transactional
    public Collection<BPCategoryGroupMemberEntity> findAll()
    {
        try
        {
            return bpCategoryGroupMemberRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget category group members", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPCategoryGroupMemberEntity bpCategoryGroupMemberEntity)
    {
        try
        {
            bpCategoryGroupMemberRepository.save(bpCategoryGroupMemberEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget category group member", e);
            throw new DataAccessException("There was an error saving the budget category group member", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPCategoryGroupMemberEntity bpCategoryGroupMemberEntity)
    {
        try
        {
            bpCategoryGroupMemberRepository.delete(bpCategoryGroupMemberEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget category group member", e);
            throw new DataAccessException("There was an error deleting the budget category group member", e);
        }
    }

    @Override
    public Optional<BPCategoryGroupMemberEntity> findById(Long id) {
        return Optional.empty();
    }
}
