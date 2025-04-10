package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.GoalStatus;
import com.app.budgetbuddy.domain.SubBudgetGoals;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.SubBudgetGoalsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class SubBudgetGoalsServiceImpl implements SubBudgetGoalsService
{
    private final SubBudgetGoalsRepository subBudgetGoalsRepository;

    @Autowired
    public SubBudgetGoalsServiceImpl(SubBudgetGoalsRepository subBudgetGoalsRepository)
    {
        this.subBudgetGoalsRepository = subBudgetGoalsRepository;
    }

    @Override
    public Collection<SubBudgetGoalsEntity> findAll()
    {
        try
        {
            return subBudgetGoalsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error while trying to find all the sub budget goals.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(SubBudgetGoalsEntity subBudgetGoalsEntity)
    {
        try
        {
            subBudgetGoalsRepository.save(subBudgetGoalsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the sub budget goals: ", e);
        }

    }

    @Override
    public void delete(SubBudgetGoalsEntity subBudgetGoalsEntity)
    {
        try
        {
            subBudgetGoalsRepository.delete(subBudgetGoalsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the sub budget goals: ", e);
        }
    }

    @Override
    public Optional<SubBudgetGoalsEntity> findById(Long id)
    {
        try
        {
            return subBudgetGoalsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error finding the sub budget goals with id {}: ", id, e);
            return Optional.empty();
        }
    }

    private SubBudgetGoals convertSubBudgetGoalEntity(SubBudgetGoalsEntity subBudgetGoalsEntity)
    {
        SubBudgetGoals subBudgetGoals = new SubBudgetGoals();
        subBudgetGoals.setStatus(GoalStatus.valueOf(subBudgetGoalsEntity.getMonthlyStatus()));
        subBudgetGoals.setGoalScore(subBudgetGoalsEntity.getGoalScore());
        subBudgetGoals.setRemaining(subBudgetGoalsEntity.getRemainingAmount());
        subBudgetGoals.setSavingsTarget(subBudgetGoalsEntity.getMonthlySavingsTarget());
        subBudgetGoals.setSubBudgetId(subBudgetGoalsEntity.getSubBudgetEntity().getId());
        subBudgetGoals.setContributedAmount(subBudgetGoalsEntity.getMonthlyContributed());
        subBudgetGoals.setGoalId(subBudgetGoalsEntity.getId());
        return subBudgetGoals;
    }

    @Override
    public SubBudgetGoals getSubBudgetGoalsEntitiesBySubBudgetId(final Long subBudgetId)
    {
        try
        {
            Optional<SubBudgetGoalsEntity> subBudgetGoalsOptional = subBudgetGoalsRepository.findSubBudgetGoalEntitiesBySubBudgetId(subBudgetId);
            if(subBudgetGoalsOptional.isEmpty())
            {
                throw new RuntimeException("No such sub budget goals with id " + subBudgetId);
            }
            return convertSubBudgetGoalEntity(subBudgetGoalsOptional.get());
        }catch(DataAccessException e){
            log.error("There was an error fetching the sub budget goals by sub-budget id {}: ", subBudgetId, e);
            throw new DataAccessException("There was an error fetching the sub budget goals", e);
        }
    }
}
