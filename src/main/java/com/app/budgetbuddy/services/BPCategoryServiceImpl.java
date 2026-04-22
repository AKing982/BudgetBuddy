package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.domain.BPGridRow;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPBudgetCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BPCategoryToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
            Map<String, BPColumnEntity> columnByDateRange = columnEntities.stream()
                    .collect(Collectors.toMap(
                            col -> col.getStartDate() + "_" + col.getEndDate(),
                            col -> col,
                            (a, b) -> a // keep first if duplicate
                    ));

            // Build a map of columnIndex -> saved entity so we can look up the FK
            List<BPCategoryEntity> savedEntities = new ArrayList<>();
            rows.forEach(row -> row.cells().forEach(cell -> {
                if (cell.actual() == null && cell.budgeted() == null) return;

                String key = cell.dateRange().getStartDate() + "_" + cell.dateRange().getEndDate();
                BPColumnEntity columnEntity = columnByDateRange.get(key);
                if(columnEntity == null)
                {
                    log.warn("No column entity found for cell index={} dateRange={}",
                            cell.columnIndex(), cell.dateRange());
                    return;
                }
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
    public List<BPCategory> getCategoriesByTemplateDetailId(Long templateDetailId)
    {
        if(templateDetailId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            List<BPCategoryEntity> entities = bpBudgetCategoryRepository.findByBpTemplateDetailId(templateDetailId);
            return entities.stream()
                    .map(bpCategoryEntity -> {
                        BPCategory bpCategory = new BPCategory();
                        bpCategory.setBudgetCategoryId(bpCategoryEntity.getId());
                        bpCategory.setActual(bpCategoryEntity.getActualAmount());
                        bpCategory.setActive(true);
                        bpCategory.setRange(new DateRange(bpCategoryEntity.getStartDate(), bpCategoryEntity.getEndDate()));
                        bpCategory.setName(bpCategoryEntity.getCategory());
                        bpCategory.setBudgeted(bpCategoryEntity.getBudgetedAmount());
                        bpCategory.setColumnIndex(bpCategoryEntity.getBpColumn().getColumnIndex());
                        return bpCategory;
                    })
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the budget categories", e);
            return Collections.emptyList();
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

    @Override
    @Transactional
    public void updateCategories(List<BPCategory> categories) {
        try
        {
//            categories.forEach(category -> {
//                BPCategoryEntity categoryEntity = bpBudgetCategoryToEntityConverter.convert(category);
//                Long id = categoryEntity.getId();
//                BigDecimal updatedAmount = categoryEntity.getBudgetedAmount();
//                log.info("Updating budget category id={} amount={}", id, updatedAmount);
//                bpBudgetCategoryRepository.updateActualAmount(id, categoryEntity.getActualAmount());
//            });
            categories.forEach(category -> {
                if (category.getRange() == null || category.getName() == null) return;
                bpBudgetCategoryRepository.updateActualAmountByCategoryAndDateRange(
                        category.getName(),
                        category.getRange().getStartDate(),
                        category.getRange().getEndDate(),
                        category.getActual()
                );
            });
        }catch(DataAccessException e){
            log.error("There was an error updating the budget categories", e);
            return;
        }
    }
}
