package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.domain.BPGridRow;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPBudgetCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BPCategoryToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BPCategoryServiceImpl implements BPCategoryService
{
    private final BPBudgetCategoryRepository bpBudgetCategoryRepository;
    private final BPCategoryToEntityConverter bpBudgetCategoryToEntityConverter;

    @Autowired
    public BPCategoryServiceImpl(BPBudgetCategoryRepository bpBudgetCategoryRepository,
                                 BPCategoryToEntityConverter bpBudgetCategoryToEntityConverter)
    {
        this.bpBudgetCategoryRepository = bpBudgetCategoryRepository;
        this.bpBudgetCategoryToEntityConverter = bpBudgetCategoryToEntityConverter;
    }

    @Override
    @Transactional
    public Collection<BPCategoryEntity> findAll()
    {
        try
        {
            return bpBudgetCategoryRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget categories", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPCategoryEntity bpBudgetCategoryEntity)
    {
        try
        {
            bpBudgetCategoryRepository.save(bpBudgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget category", e);
            throw new DataAccessException("There was an error saving the budget category", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPCategoryEntity bpBudgetCategoryEntity)
    {
        try
        {
            bpBudgetCategoryRepository.delete(bpBudgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget category", e);
            throw new DataAccessException("There was an error deleting the budget category", e);
        }
    }

    @Override
    public Optional<BPCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void saveModel(BPCategory budgetCategory)
    {
        try
        {
            BPCategoryEntity budgetCategoryEntity = bpBudgetCategoryToEntityConverter.convert(budgetCategory);
            bpBudgetCategoryRepository.save(budgetCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget category", e);
            throw new DataAccessException("There was an error saving the budget category", e);
        }
    }

    @Override
    public List<BPCategoryEntity> saveCategories(List<BPGridRow> rows, List<BPColumnEntity> columnEntities)
    {
        if(rows == null || rows.isEmpty() || columnEntities == null || columnEntities.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            // Build a map of columnIndex -> saved entity so we can look up the FK
            List<BPCategoryEntity> savedEntities = new ArrayList<>();
            rows.forEach(row -> row.cells().forEach(cell -> {
                if(cell.actual() == null) return; // skip empty cells
                BPColumnEntity columnEntity = columnEntities.stream()
                        .filter(col -> col.getColumnIndex() == cell.columnIndex()
                                && col.getStartDate().equals(cell.dateRange().getStartDate())
                                && col.getEndDate().equals(cell.dateRange().getEndDate()))
                        .findFirst()
                        .orElse(null);

                if(columnEntity == null) return;
                BPCategoryEntity entity = BPCategoryEntity.builder()
                        .bpColumn(columnEntity)
                        .bpTemplateDetail(columnEntity.getBpTemplateDetail())
                        .startDate(cell.dateRange().getStartDate())
                        .endDate(cell.dateRange().getEndDate())
                        .actualAmount(cell.actual())
                        .category(row.category())
                        .budgetedAmount(cell.budgeted())
                        .isOverBudget(false)
                        .build();
                savedEntities.add(bpBudgetCategoryRepository.save(entity));
            }));
            return savedEntities;
        }
        catch(DataAccessException e)
        {
            log.error("There was an error saving the budget categories", e);
            throw new DataAccessException("There was an error saving the budget categories", e);
        }
    }

    @Override
    @Transactional
    public void saveCategories(List<BPCategory> categories)
    {
        try
        {
            categories.forEach(category -> {
                BPCategoryEntity categoryEntity = bpBudgetCategoryToEntityConverter.convert(category);
                bpBudgetCategoryRepository.save(categoryEntity);
            });
        }catch(DataAccessException e){
            log.error("There was an error saving the budget categories", e);
            throw new DataAccessException("There was an error saving the budget categories", e);
        }
    }
}
