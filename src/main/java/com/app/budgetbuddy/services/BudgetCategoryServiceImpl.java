package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetCategoryRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class BudgetCategoryServiceImpl implements BudgetCategoryService
{
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final BudgetCategoryConverter transactionCategoryConverter;
    private final SubBudgetRepository subBudgetRepository;
    private final CategoryRepository categoryRepository;

    @Autowired
    public BudgetCategoryServiceImpl(BudgetCategoryRepository budgetCategoryRepository,
                                     BudgetCategoryConverter transactionCategoryConverter,
                                     SubBudgetRepository subBudgetRepository,
                                     CategoryRepository categoryRepository)
    {
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionCategoryConverter = transactionCategoryConverter;
        this.subBudgetRepository = subBudgetRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Collection<BudgetCategoryEntity> findAll() {
        return budgetCategoryRepository.findAll();
    }

    @Override
    public void save(BudgetCategoryEntity userBudgetCategoryEntity) {
        budgetCategoryRepository.save(userBudgetCategoryEntity);
    }

    @Override
    public void delete(BudgetCategoryEntity userBudgetCategoryEntity) {
        budgetCategoryRepository.delete(userBudgetCategoryEntity);
    }

    @Override
    public Optional<BudgetCategoryEntity> findById(Long id) {
        return Optional.empty();
    }


    @Override
    public List<BudgetCategoryEntity> getAllBudgetCategoriesByUser(Long userId)
    {
        return budgetCategoryRepository.findAllByUserId(userId);
    }

    @Override
    public List<BudgetCategoryEntity> getActiveBudgetCategoriesByUser(Long userId)
    {
        return budgetCategoryRepository.findActiveCategoriesByUser(userId);
    }

    @Override
    @Transactional
    public boolean existsByCategoryDateRange(final String category, final LocalDate dateStart, final LocalDate dateEnd, final Long subBudgetId)
    {
        if(category.isEmpty() || dateStart == null || dateEnd == null || subBudgetId == null)
        {
            return false;
        }
        try
        {
            return budgetCategoryRepository.existsByCategoryDateRange(category, dateStart, dateEnd, subBudgetId);
        }catch(DataAccessException e){
            log.error("There was an error validating budget category {} exists for start {} and end {}: {}",  category, dateStart, dateEnd, subBudgetId);
            return false;
        }
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByBudgetId(Long budgetId) {
        return budgetCategoryRepository.findByBudgetId(budgetId);
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return budgetCategoryRepository.findByBudgetIdAndDateRange(budgetId, startDate, endDate);
    }

    @Override
    public List<BudgetCategoryEntity> getBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getBudgetCategoryListByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        List<BudgetCategoryEntity> budgetCategoryEntities = budgetCategoryRepository.findByBudgetIdAndDateRange(budgetId, startDate, endDate);
        List<BudgetCategory> transactionCategoryList = new ArrayList<>();
        for(BudgetCategoryEntity budgetCategoryEntity : budgetCategoryEntities){
            BudgetCategory budgetCategory = convertEntityToModel(budgetCategoryEntity);
            transactionCategoryList.add(budgetCategory);
        }
        return transactionCategoryList;
    }

    private BudgetCategory convertEntityToModel(BudgetCategoryEntity budgetCategoryEntity)
    {
        BudgetCategory budgetCategory = new BudgetCategory();
        budgetCategory.setId(budgetCategoryEntity.getId());
        budgetCategory.setSubBudgetId(budgetCategoryEntity.getSubBudget().getId());
        budgetCategory.setCategoryName(budgetCategoryEntity.getCategoryName());
        budgetCategory.setBudgetedAmount(budgetCategoryEntity.getBudgetedAmount());
        budgetCategory.setBudgetActual(Math.abs(budgetCategoryEntity.getActual()));
        budgetCategory.setEndDate(budgetCategoryEntity.getEndDate());
        budgetCategory.setStartDate(budgetCategoryEntity.getStartDate());
        budgetCategory.setIsActive(budgetCategoryEntity.isActive());
        budgetCategory.setOverSpendingAmount(budgetCategoryEntity.getOverspendingAmount());
        // Fix the isOverSpent handling
        budgetCategory.setOverSpent(
                budgetCategoryEntity.getIsOverSpent() != null ?
                        budgetCategoryEntity.getIsOverSpent() :
                        false
        );
        return budgetCategory;
    }

    @Override
    public List<BudgetCategory> getBudgetCategoriesByDate(Long subBudgetId, LocalDate currentDate, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<BudgetCategoryEntity> budgetCategoryEntities = budgetCategoryRepository.findBudgetCategoriesByDate(subBudgetId, currentDate, startDate, endDate);
            if(budgetCategoryEntities == null || budgetCategoryEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            else
            {
                return budgetCategoryEntities.stream()
                        .map(this::convertEntityToModel)
                        .distinct()
                        .toList();
            }
        }catch(DataAccessException e)
        {
            return Collections.emptyList();
        }
    }

    private BudgetCategoryEntity convertBudgetCategoryToEntity(BudgetCategory budgetCategory)
    {
        BudgetCategoryEntity budgetCategoryEntity = new BudgetCategoryEntity();
        budgetCategoryEntity.setId(budgetCategory.getId());
        if(budgetCategory.getCategoryName() == null)
        {
            budgetCategoryEntity.setCategoryName("Uncategorized");
        }
        else {
            budgetCategoryEntity.setCategoryName(budgetCategory.getCategoryName());
        }
        budgetCategoryEntity.setActive(budgetCategory.getIsActive());
        budgetCategoryEntity.setOverspendingAmount(budgetCategory.getOverSpendingAmount());
        budgetCategoryEntity.setStartDate(budgetCategory.getStartDate());
        budgetCategoryEntity.setEndDate(budgetCategory.getEndDate());
        budgetCategoryEntity.setSubBudget(getSubBudgetEntityById(budgetCategory.getSubBudgetId()));
        budgetCategoryEntity.setBudgetedAmount(budgetCategory.getBudgetedAmount());
        budgetCategoryEntity.setActual(Math.abs(budgetCategory.getBudgetActual()));
        budgetCategoryEntity.setCreatedat(LocalDateTime.now());
        budgetCategoryEntity.setIsOverSpent(budgetCategory.isOverSpent());
        return budgetCategoryEntity;
    }

    private SubBudgetEntity getSubBudgetEntityById(Long subBudgetId)
    {
        return subBudgetRepository.findById(subBudgetId).orElse(null);
    }

    @Override
    public List<BudgetCategory> saveAll(List<BudgetCategory> budgetCategories)
    {
        if(budgetCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<BudgetCategory> savedCategories = new ArrayList<>();
            for(BudgetCategory budgetCategory : budgetCategories)
            {
                Optional<BudgetCategoryEntity> existing = budgetCategoryRepository.findBySubBudgetIdAndCategoryAndDateRange(budgetCategory.getSubBudgetId(),
                        budgetCategory.getCategoryName(),
                        budgetCategory.getStartDate(),
                        budgetCategory.getEndDate());
                if(existing.isPresent())
                {
                    BudgetCategoryEntity existingEntity = existing.get();
                    existingEntity.setBudgetedAmount(budgetCategory.getBudgetedAmount());
                    existingEntity.setActual(Math.abs(budgetCategory.getBudgetActual()));
                    existingEntity.setIsOverSpent(budgetCategory.isOverSpent());
                    existingEntity.setOverspendingAmount(budgetCategory.getOverSpendingAmount());
                    budgetCategoryRepository.save(existingEntity);
                    savedCategories.add(budgetCategory);
                }
                else
                {
                    BudgetCategoryEntity budgetCategoryEntity = convertBudgetCategoryToEntity(budgetCategory);
                    budgetCategoryRepository.save(budgetCategoryEntity);
                }
                savedCategories.add(budgetCategory);
            }
            return budgetCategories;
        }catch(DataAccessException e){
            return Collections.emptyList();
        }
    }

    @Override
    public Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return budgetCategoryRepository.sumBudgetedAmountByUserAndDateRange(userId, startDate, endDate);
    }
}

