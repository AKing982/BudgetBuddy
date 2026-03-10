package com.app.budgetbuddy.workbench;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.List;

public class ParserUtils
{
    private static final List<DateTimeFormatter> FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("M/d/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("MM-dd-yyyy"),
            DateTimeFormatter.ofPattern("M-d-yyyy")   // in case single-digit variant appears too
    );

    public static LocalDate toLocalDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        String trimmed = dateStr.trim();
        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Unable to parse date: " + dateStr);
    }

    // keep the two-arg overload for callers that know their format
    public static LocalDate toLocalDate(String dateStr, String pattern) {
        if (dateStr == null || dateStr.isBlank()) return null;
        return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern(pattern));
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
