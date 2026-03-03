package com.app.budgetbuddy.workbench;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class ParserUtils
{
    public static LocalDate toLocalDate(String dateStr, String pattern)
    {
        if(dateStr == null || dateStr.isBlank()) return null;
        // Logic from your old convertDateToLocalDate moved here
        return LocalDate.parse(dateStr.replace("-", "/"), DateTimeFormatter.ofPattern(pattern));
    }

    public static BigDecimal toBigDecimal(String val)
    {
        if (val == null || val.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(val.replaceAll("[$,\\s]", ""));
    }

    public static Long removeLeadingZeros(String seq)
    {
        return Long.parseLong(seq.replaceAll("^0+", "").split("\\.")[0]);
    }
}
