package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.math.*;
import com.app.budgetbuddy.entities.PreCalculationCategoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidCoordinateLengthException;
import com.app.budgetbuddy.exceptions.InvalidMathModelException;
import com.app.budgetbuddy.services.PreCalculationCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PreCalculationModelService
{
    private final PreCalculationCategoryService preCalculationCategoryService;
    private final SubBudgetGoalsService subBudgetGoalsService;
    private final PreCalculationCoordinateService preCalculationCoordinateService;
    private final PreCalculationModelFitService preCalculationModelFitService;

    @Autowired
    public PreCalculationModelService(PreCalculationCategoryService preCalculationCategoryService,
                                      SubBudgetGoalsService subBudgetGoalsService,
                                      PreCalculationCoordinateService preCalculationCoordinateService,
                                      PreCalculationModelFitService preCalculationModelFitService)
    {
        this.preCalculationCategoryService = preCalculationCategoryService;
        this.subBudgetGoalsService = subBudgetGoalsService;
        this.preCalculationCoordinateService = preCalculationCoordinateService;
        this.preCalculationModelFitService = preCalculationModelFitService;
    }

    public void savePreCalculationCategories(List<PreCalculationCategory> preCalculationCategories)
    {
        try
        {
            for(PreCalculationCategory preCalculationCategory : preCalculationCategories)
            {
                Optional<PreCalculationCategoryEntity> preCalculationCategoryEntity = preCalculationCategoryService.createPreCalculationCategoryEntity(preCalculationCategory);
                if(preCalculationCategoryEntity.isEmpty())
                {
                    log.error("Error saving precalculation category: {}", preCalculationCategory);
                    continue;
                }
                PreCalculationCategoryEntity preCalculationCategoryEntity1 = preCalculationCategoryEntity.get();
                preCalculationCategoryService.save(preCalculationCategoryEntity1);
                log.info("Saved precalculation category: {}", preCalculationCategoryEntity1);
            }
        }catch(DataAccessException e){
            log.error("Error saving precalculation categories: {}", e.getMessage());
            throw new DataAccessException("Error saving precalculation categories: " + e.getMessage());
        }
    }

    public List<PreCalculationCategory> createPreCalculationCategories(final Map<WeekNumber, List<PreCalculationEntry>> weeklyPrecalculationEntries, final BudgetSchedule budgetSchedule)
    {
        return null;
    }

}
