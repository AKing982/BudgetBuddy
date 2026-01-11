package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class BudgetPeriodCategoryService
{
    private final BudgetPeriodCategoryHandlerFactory handlerFactory;

    @Autowired
    public BudgetPeriodCategoryService(BudgetPeriodCategoryHandlerFactory handlerFactory)
    {
        this.handlerFactory = handlerFactory;
    }

    public List<BudgetPeriodCategory> getBudgetPeriodCategoriesByPeriod(SubBudget subBudget, Period period)
    {
        List<BudgetSchedule> budgetScheduleList = subBudget.getBudgetSchedule();
        BudgetSchedule budgetSchedule = budgetScheduleList.get(0);
        if(budgetSchedule == null || period == null)
        {
            return Collections.emptyList();
        }
        try
        {
            BudgetPeriodCategoryHandler handler = handlerFactory.getHandler(period);
            return handler.getBudgetPeriodCategories(subBudget);
        }catch(Exception e){
            log.error("Error determining budget period categories: ", e);
            return Collections.emptyList();
        }
    }

    public List<BudgetPeriodCategory> getBudgetPeriodCategories(final SubBudget budget, final BudgetSchedule budgetSchedule)
    {
        if(budget == null || budgetSchedule == null)
        {
            return Collections.emptyList();
        }

        try
        {
            Period period = budgetSchedule.getPeriodType();
            BudgetPeriodCategoryHandler handler = handlerFactory.getHandler(period);
            return handler.getBudgetPeriodCategories(budget);
        } catch (Exception e)
        {
            log.error("Error determining budget period categories: ", e);
            return Collections.emptyList();
        }
    }


}
