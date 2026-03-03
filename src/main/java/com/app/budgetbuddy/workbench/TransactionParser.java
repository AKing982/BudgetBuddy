package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.TransactionCSV;

public interface TransactionParser
{
    boolean supports(String institution);
    TransactionCSV parseRow(String[] row, Long userId);
    char getDelimiter();
}
