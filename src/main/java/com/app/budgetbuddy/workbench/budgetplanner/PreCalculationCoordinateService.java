package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PreCalculationCoordinateService
{
    public List<CategoryCoordinates> convertEntriesToCoordinates(
            final Map<WeekNumber, List<PreCalculationEntry>> entriesByWeek,
            final SubBudgetGoals subBudgetGoals)
    {
//        if(entriesByWeek == null || entriesByWeek.isEmpty() || subBudgetGoals == null)
//        {
//            return Collections.emptyList();
//        }
//        int numberOfWeeks = entriesByWeek.size();
//        BigDecimal weeklySavingsGoal = subBudgetGoals.getSavingsTarget()
//                .divide(BigDecimal.valueOf(numberOfWeeks), 2, RoundingMode.HALF_UP);
//
//        List<CategoryCoordinates> coordinates = new ArrayList<>();
//        for(Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : entriesByWeek.entrySet())
//        {
//            int weekNumberInt = entry.getKey().getWeekNumber();
//            for(PreCalculationEntry preCalcEntry : entry.getValue())
//            {
//                BigDecimal saved = preCalcEntry.budgetedAmount()
//                        .subtract(preCalcEntry.currentSpending());
//                double goalSaved = weeklySavingsGoal.subtract(saved).doubleValue();
//                coordinates.add(new CategoryCoordinates(
//                        preCalcEntry.category(),
//                        weekNumberInt,
//                        preCalcEntry.currentSpending().doubleValue(),
//                        saved.doubleValue(),
//                        goalSaved));
//            }
//        }
//        return coordinates;
        return null;
    }

    public Map<String, List<CategoryCoordinates>> groupByCategory(
            final List<CategoryCoordinates> coordinates)
    {
        if(coordinates == null || coordinates.isEmpty())
        {
            return Collections.emptyMap();
        }
        return coordinates.stream()
                .collect(Collectors.groupingBy(CategoryCoordinates::getCategory));
    }

    public double[] extractCoordinates(
            final List<CategoryCoordinates> coordinates,
            final CoordinateType coordinateType)
    {
//        if(coordinates == null || coordinates.isEmpty())
//        {
//            return new double[0];
//        }
//        return switch(coordinateType)
//        {
//            case X -> coordinates.stream().mapToDouble(CategoryCoordinates::getX).toArray();
//            case Y -> coordinates.stream().mapToDouble(CategoryCoordinates::getY).toArray();
//            case Z -> coordinates.stream().mapToDouble(CategoryCoordinates::getZ).toArray();
//            case W -> coordinates.stream().mapToDouble(CategoryCoordinates::getW).toArray();
//        };
        return null;
    }
}
