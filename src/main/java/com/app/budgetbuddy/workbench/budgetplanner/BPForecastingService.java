package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPForecastCategory;
import com.app.budgetbuddy.domain.BudgetSchedule;
import com.app.budgetbuddy.domain.PositionType;
import com.app.budgetbuddy.domain.WeekNumber;
import com.app.budgetbuddy.domain.math.AbstractMathModel;
import com.app.budgetbuddy.services.PreCalculationCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class BPForecastingService
{
    private final PreCalculationCategoryService preCalculationCategoryService;

    @Autowired
    public BPForecastingService(PreCalculationCategoryService preCalculationCategoryService)
    {
        this.preCalculationCategoryService = preCalculationCategoryService;
    }

    private int calculateNumberOfMonthsSinceCurrentDate(LocalDate currentDate)
    {
        if(currentDate == null)
        {
            return 0;
        }
        final int currentYear = currentDate.getYear();
        final LocalDate budgetStartDate = LocalDate.of(currentYear, 1, 1);
        return (int) budgetStartDate.until(currentDate).toTotalMonths();
    }

    public List<WeekNumber> calculateWeekNumbersForMonth(final BudgetSchedule budgetSchedule)
    {
        return null;
    }
//
//    public Map<PositionType, AbstractMathModel> loadCategoryMathModels()
//
//    public List<BPForecastCategory> forecastWeeklyCategories(Map<WeekNumber, >)

}
