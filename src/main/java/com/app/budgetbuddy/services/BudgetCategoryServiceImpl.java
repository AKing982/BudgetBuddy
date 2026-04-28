package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategorySpending;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.BudgetCategoryRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryModelConverter;
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
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetCategoryServiceImpl implements BudgetCategoryService
{
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final BudgetCategoryConverter transactionCategoryConverter;
    private final TransactionCategoryRepository transactionCategoryRepository;
    private final BudgetCategoryModelConverter budgetCategoryModelConverter;
    private final SubBudgetRepository subBudgetRepository;

    @Autowired
    public BudgetCategoryServiceImpl(BudgetCategoryRepository budgetCategoryRepository,
                                     BudgetCategoryConverter transactionCategoryConverter,
                                     TransactionCategoryRepository transactionCategoryRepository,
                                     BudgetCategoryModelConverter budgetCategoryModelConverter,
                                     SubBudgetRepository subBudgetRepository)
    {
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionCategoryConverter = transactionCategoryConverter;
        this.transactionCategoryRepository = transactionCategoryRepository;
        this.subBudgetRepository = subBudgetRepository;
        this.budgetCategoryModelConverter = budgetCategoryModelConverter;
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
    public List<BudgetCategory> updateBudgetCategories(Map<Long, String> budgetCategoriesToUpdate)
    {
        if(budgetCategoriesToUpdate.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<Long> budgetCategoryIds = budgetCategoriesToUpdate.keySet().stream().toList();
            budgetCategoriesToUpdate.forEach(budgetCategoryRepository::updateCategoryNameById);
            List<BudgetCategoryEntity> budgetCategoryEntities = budgetCategoryRepository.findAllById(budgetCategoryIds);
            return budgetCategoryEntities.stream()
                    .map(budgetCategoryModelConverter::convert)
                    .distinct()
                    .toList();

        }catch(DataAccessException e){
            log.error("There was an error updating the budget categories: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalCSVIncomesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            Double totalIncome = transactionCategoryRepository.findCSVIncomeTotalByDateRangeAndUserId(startDate, endDate, userId);
            if(totalIncome == null || totalIncome == 0)
            {
                return BigDecimal.ZERO;
            }
            else
            {
                return BigDecimal.valueOf(totalIncome);
            }
        }catch(DataAccessException e) {
            log.error("There was an error getting the total CSV income by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalIncomesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            Double totalIncome = transactionCategoryRepository.findTransactionIncomeTotalByDateRangeAndUserId(startDate, endDate, userId);
            if(totalIncome == null || totalIncome == 0)
            {
                return BigDecimal.ZERO;
            }
            else
            {
                return BigDecimal.valueOf(totalIncome);
            }
        }catch(DataAccessException e) {
            log.error("There was an error getting the total income by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalCSVExpensesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            log.info("Getting total CSV expense by date range overlaps: {} to {}", startDate, endDate);
            Double totalExpense = transactionCategoryRepository.findCSVExpenseTotalByDateRangeAndUserId(startDate, endDate, userId);
            log.info("Total CSV Expense: {}", totalExpense);
            if(totalExpense == null || totalExpense == 0)
            {
                return BigDecimal.ZERO;
            }
            else
            {
                return BigDecimal.valueOf(totalExpense);
            }
        }catch(DataAccessException e) {
            log.error("There was an error getting the total CSV expense by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalExpensesByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            log.info("Getting total expense by date range overlaps: {} to {}", startDate, endDate);
            Double totalExpense = transactionCategoryRepository.findTransactionExpenseTotalByDateRangeAndUserId(startDate, endDate, userId);
            log.info("Total Expense: {}", totalExpense);
            if(totalExpense == null || totalExpense == 0)
            {
                return BigDecimal.ZERO;
            }
            else
            {
                return BigDecimal.valueOf(totalExpense);
            }
        }catch(DataAccessException e) {
            log.error("There was an error getting the total expense by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalExpensesByDateRange(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        if(subBudgetId == null || startDate == null || endDate == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return budgetCategoryRepository.findExpenseTotalByUserAndDateRange(subBudgetId, startDate, endDate);
        }catch(DataAccessException e) {
            log.error("There was an error getting the total expense by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    @Transactional
    public BigDecimal getTotalIncomeByDateRange(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            log.info("Getting total income by subBudgetId and date range: {} to {}, {}", subBudgetId, startDate, endDate);
            return budgetCategoryRepository.findIncomeTotalByUserAndDateRange(subBudgetId, startDate, endDate);
        }catch(DataAccessException e) {
            log.error("There was an error getting the total income by user ID and date range: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getBudgetCategorySpendingByDateRange(String category, LocalDate startDate, LocalDate endDate, Long subBudgetId)
    {
        if(category.isEmpty() || startDate == null || endDate == null || subBudgetId == null)
        {
            return BigDecimal.ZERO;
        }
        try
        {
            return budgetCategoryRepository.findActualAmountByCategoryAndDateRange(category, startDate, endDate, subBudgetId);
        }catch(DataAccessException e){
            log.error("There was an error getting the budget category spending for category {} and date range {}: {}: {}", category, startDate, endDate, e.getMessage());
            return BigDecimal.ZERO;
        }
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

    @Override
    @Transactional
    public List<BudgetCategory> getBudgetCategoriesByDateRange(LocalDate startDate, LocalDate endDate, Long userId)
    {
        if(startDate == null || endDate == null || userId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            List<BudgetCategorySpending> budgetCategorySpending = budgetCategoryRepository.findSpendingByDateRangeAndUserId(startDate, endDate, userId);
            if(budgetCategorySpending == null || budgetCategorySpending.isEmpty())
            {
                return Collections.emptyList();
            }
            else
            {
                return budgetCategorySpending.stream()
                        .map(budgetCategorySpending1 -> {
                            BudgetCategory budgetCategory = new BudgetCategory();
                            budgetCategory.setIsActive(true);
                            budgetCategory.setBudgetedAmount(budgetCategorySpending1.totalBudgeted());
                            budgetCategory.setStartDate(budgetCategorySpending1.startDate());
                            budgetCategory.setEndDate(budgetCategorySpending1.endDate());
                            budgetCategory.setCategoryName(budgetCategorySpending1.categoryName());
                            budgetCategory.setBudgetActual(budgetCategorySpending1.spending());
                            budgetCategory.setSubBudgetId(budgetCategorySpending1.subBudgetId());
                            return budgetCategory;
                        })
                        .distinct()
                        .toList();
            }
        }catch(DataAccessException e)
        {
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<BudgetCategory> getBudgetCategorySpendingByDateRangeOverlaps(LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            // TODO: Fix issue with setting proper start date and end date and sub BudgetId for budget categories created below
            List<BudgetCategorySpending> budgetCategorySpendings = transactionCategoryRepository.findSpendingByDateRangeAndUserId(startDate, endDate, userId);
            return budgetCategorySpendings.stream()
                    .map(budgetCategorySpending -> {
                        BudgetCategory budgetCategory = new BudgetCategory();
                        budgetCategory.setIsActive(true);
                        budgetCategory.setBudgetedAmount(budgetCategorySpending.totalBudgeted());
                        budgetCategory.setStartDate(startDate);
                        budgetCategory.setEndDate(endDate);
                        budgetCategory.setCategoryName(budgetCategorySpending.categoryName());
                        budgetCategory.setBudgetActual(budgetCategorySpending.spending());
//                        log.info("Budget Category for date range {} to {} : {}", startDate, endDate, budgetCategory);
                        return budgetCategory;
                    })
                    .toList();

        }catch(DataAccessException e){
            log.error("There was an error getting the budget category spending by date range overlaps: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public Optional<BudgetCategoryEntity> findBudgetCategoryById(Long id)
    {
        return budgetCategoryRepository.findById(id);
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
    @Transactional
    public List<BudgetCategory> getBudgetCategoriesByUserId(Long userId)
    {
        try
        {
            List<BudgetCategoryEntity> budgetCategoryEntities = budgetCategoryRepository.findCategoriesByUser(userId);
            return convertBudgetCategoryEntities(budgetCategoryEntities);
        }catch(DataAccessException e){
            log.error("There was an error getting the budget categories by user ID: ", e);
            return Collections.emptyList();
        }
    }

    private List<BudgetCategory> convertBudgetCategoryEntities(List<BudgetCategoryEntity> budgetCategoryEntities)
    {
        return budgetCategoryEntities.stream()
                .map(budgetCategoryModelConverter::convert)
                .distinct()
                .toList();
    }

    @Override
    @Transactional
    public List<Object[]> getHistoricalMonthStatsByCategory(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return budgetCategoryRepository.findHistoricalMonthStatsByCategory(userId, startDate, endDate);
        }catch(DataAccessException e){
            log.error("There was an error getting the historical month stats by category: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<Object[]> getHistoricalMonthHistoryByCategory(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return budgetCategoryRepository.findHistoricalMonthHistoryByCategory(userId, startDate, endDate);
        }catch(DataAccessException e){
            log.error("There was an error getting the historical month history by category: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void updateBudgetCategoryAmount(String category, Long userId, LocalDate startDate, LocalDate endDate, BigDecimal amount)
    {
        try
        {
            double updatedBudgetAmount = amount.doubleValue();
            budgetCategoryRepository.updateBudgetedAmount(category, updatedBudgetAmount, userId, startDate, endDate);
        }
        catch(DataException e)
        {
            log.error("Error updating budget category amount for category={}, userId={}: {}",
                    category, userId, e.getMessage());
            throw e;
        }
    }

    @Override
    public Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return budgetCategoryRepository.sumBudgetedAmountByUserAndDateRange(userId, startDate, endDate);
    }
}

