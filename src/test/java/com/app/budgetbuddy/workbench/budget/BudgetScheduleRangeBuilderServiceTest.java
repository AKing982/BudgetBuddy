package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import jakarta.persistence.Embeddable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BudgetScheduleRangeBuilderServiceTest
{
    @Mock
    private BudgetScheduleRangeService budgetScheduleRangeService;

    @InjectMocks
    private BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService;

    private Budget budget;

    @BeforeEach
    void setUp() {

        budget = new Budget();
        budget.setStartDate(LocalDate.of(2025,1 ,1));
        budget.setEndDate(LocalDate.of(2025,12, 31));
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetName("Savings Budget Plan");
        budget.setBudgetDescription("Savings Budget Plan");
        budget.setTotalMonthsToSave(12);
        budget.setUserId(1L);
        budget.setId(1L);
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));
        budgetScheduleRangeBuilderService = new BudgetScheduleRangeBuilderService(budgetScheduleRangeService);
    }

    @Test
    void testCreateBudgetScheduleRangesBySubBudget_whenSubBudgetValid_thenReturnBudgetScheduleRanges()
    {
        SubBudget januarySubBudget = new SubBudget();
        januarySubBudget.setBudget(budget);
        januarySubBudget.setStartDate(LocalDate.of(2025,1 ,1));
        januarySubBudget.setEndDate(LocalDate.of(2025,1, 31));
        januarySubBudget.setActive(true);
        januarySubBudget.setAllocatedAmount(new BigDecimal("3260"));
        januarySubBudget.setSpentOnBudget(new BigDecimal("1609"));
        januarySubBudget.setSubBudgetName("January Sub Budget");
        januarySubBudget.setSubSavingsAmount(new BigDecimal("120"));
        januarySubBudget.setSubSavingsTarget(new BigDecimal("250"));

        List<BudgetScheduleRange> budgetScheduleRangeList = generateJanuaryBudgetScheduleRanges();
        List<BudgetScheduleRange> actual = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(januarySubBudget);
        assertEquals(budgetScheduleRangeList.size(), actual.size());
        for(int i = 0; i < budgetScheduleRangeList.size(); i++)
        {
            BudgetScheduleRange actualBudgetScheduleRange = actual.get(i);
            BudgetScheduleRange expectedBudgetScheduleRange = budgetScheduleRangeList.get(i);
            assertEquals(expectedBudgetScheduleRange.getBudgetedAmount(), actualBudgetScheduleRange.getBudgetedAmount());
            assertEquals(expectedBudgetScheduleRange.getEndRange(), actualBudgetScheduleRange.getEndRange());
            assertEquals(expectedBudgetScheduleRange.getStartRange(), actualBudgetScheduleRange.getStartRange());
            assertEquals(expectedBudgetScheduleRange.getSpentOnRange(), actualBudgetScheduleRange.getSpentOnRange());
            assertEquals(expectedBudgetScheduleRange.getRangeType(), actualBudgetScheduleRange.getRangeType());
        }
    }

    @Test
    void testGetBudgetScheduleRangeByDate_whenStartDateAndEndDateValid_thenReturnBudgetScheduleRanges(){
        LocalDate startDate = LocalDate.of(2025,1 ,1);
        LocalDate endDate = LocalDate.of(2025, 1, 15);

        BudgetScheduleRange budgetScheduleRange = new BudgetScheduleRange();
        budgetScheduleRange.setStartRange(startDate);
        budgetScheduleRange.setEndRange(LocalDate.of(2025, 1, 7));
        budgetScheduleRange.setRangeType("Week");
        budgetScheduleRange.setSpentOnRange(new BigDecimal("120"));
        budgetScheduleRange.setBudgetedAmount(new BigDecimal("652"));
        budgetScheduleRange.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025,1, 7)));

        BudgetScheduleRange budgetScheduleRange2 = new BudgetScheduleRange();
        budgetScheduleRange2.setStartRange(LocalDate.of(2025, 1, 8));
        budgetScheduleRange2.setEndRange(LocalDate.of(2025, 1, 15));
        budgetScheduleRange2.setRangeType("Week");
        budgetScheduleRange2.setSpentOnRange(new BigDecimal("120"));
        budgetScheduleRange2.setBudgetedAmount(new BigDecimal("652"));
        budgetScheduleRange2.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025,1, 15)));

        List<BudgetScheduleRange> budgetScheduleRanges = generateJanuaryBudgetScheduleRanges();
        budgetScheduleRanges.add(budgetScheduleRange);
        budgetScheduleRanges.add(budgetScheduleRange2);

        List<BudgetScheduleRange> actual = budgetScheduleRangeBuilderService.getBudgetScheduleRangeByDate(startDate, endDate, 1L);
        assertEquals(budgetScheduleRanges.size(), actual.size());
        for(int i = 0; i < budgetScheduleRanges.size(); i++)
        {
            BudgetScheduleRange actualBudgetScheduleRange = actual.get(i);
            BudgetScheduleRange expectedBudgetScheduleRange = budgetScheduleRanges.get(i);
            assertEquals(expectedBudgetScheduleRange.getBudgetedAmount(), actualBudgetScheduleRange.getBudgetedAmount());
            assertEquals(expectedBudgetScheduleRange.getEndRange(), actualBudgetScheduleRange.getEndRange());
            assertEquals(expectedBudgetScheduleRange.getStartRange(), actualBudgetScheduleRange.getStartRange());
            assertEquals(expectedBudgetScheduleRange.getRangeType(), actualBudgetScheduleRange.getRangeType());
            assertEquals(expectedBudgetScheduleRange.getSpentOnRange(), actualBudgetScheduleRange.getSpentOnRange());
            assertEquals(expectedBudgetScheduleRange.getBudgetDateRange().getStartDate(), actualBudgetScheduleRange.getBudgetDateRange().getStartDate());
            assertEquals(expectedBudgetScheduleRange.getBudgetDateRange().getEndDate(), actualBudgetScheduleRange.getBudgetDateRange().getEndDate());
        }


    }

    private List<BudgetScheduleRange> generateJanuaryBudgetScheduleRanges(){
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange januaryFirstWeek = new BudgetScheduleRange();
        januaryFirstWeek.setBudgetedAmount(new BigDecimal("652"));
        januaryFirstWeek.setStartRange(LocalDate.of(2025, 1, 1));
        januaryFirstWeek.setEndRange(LocalDate.of(2025, 1, 7));
        januaryFirstWeek.setSpentOnRange(new BigDecimal("322"));
        januaryFirstWeek.setRangeType("Week");
        januaryFirstWeek.setSingleDate(false);

        BudgetScheduleRange januarySecondWeek = new BudgetScheduleRange();
        januarySecondWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januarySecondWeek.setSingleDate(false);
        januarySecondWeek.setBudgetedAmount(new BigDecimal("652"));
        januarySecondWeek.setStartRange(LocalDate.of(2025, 1, 8));
        januarySecondWeek.setEndRange(LocalDate.of(2025, 1, 14));
        januarySecondWeek.setSpentOnRange(new BigDecimal("322"));
        januarySecondWeek.setRangeType("Week");

        BudgetScheduleRange januaryThirdWeek = new BudgetScheduleRange();
        januaryThirdWeek.setStartRange(LocalDate.of(2025, 1, 15));
        januaryThirdWeek.setEndRange(LocalDate.of(2025, 1, 21));
        januaryThirdWeek.setBudgetedAmount(new BigDecimal("652"));
        januaryThirdWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 22)));
        januaryThirdWeek.setRangeType("Week");
        januaryThirdWeek.setSpentOnRange(new BigDecimal("322"));
        januaryThirdWeek.setSingleDate(false);

        BudgetScheduleRange januaryFourthWeek = new BudgetScheduleRange();
        januaryFourthWeek.setSingleDate(false);
        januaryFourthWeek.setStartRange(LocalDate.of(2025, 1, 22));
        januaryFourthWeek.setEndRange(LocalDate.of(2025, 1, 28));
        januaryFourthWeek.setSpentOnRange(new BigDecimal("322"));
        januaryFourthWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 23), LocalDate.of(2025, 1, 31)));
        januaryFourthWeek.setRangeType("Week");
        januaryFourthWeek.setBudgetedAmount(new BigDecimal("652"));

        BudgetScheduleRange januaryExtraDay = new BudgetScheduleRange();
        januaryExtraDay.setSingleDate(false);
        januaryExtraDay.setStartRange(LocalDate.of(2025, 1, 29));
        januaryExtraDay.setEndRange(LocalDate.of(2025, 1, 31));
        januaryExtraDay.setSpentOnRange(new BigDecimal("322"));
        januaryExtraDay.setBudgetedAmount(new BigDecimal("652"));
        januaryExtraDay.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        januaryExtraDay.setRangeType("Week");

        budgetScheduleRanges.add(januaryFirstWeek);
        budgetScheduleRanges.add(januarySecondWeek);
        budgetScheduleRanges.add(januaryThirdWeek);
        budgetScheduleRanges.add(januaryFourthWeek);
        budgetScheduleRanges.add(januaryExtraDay);
        return budgetScheduleRanges;
    }



    @AfterEach
    void tearDown() {
    }
}