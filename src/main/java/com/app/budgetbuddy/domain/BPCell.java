package com.app.budgetbuddy.domain;

public record BPCell(BPColumn column, double amount, boolean isOverSpend, boolean isEstimated, boolean isEditable, boolean isPercentage, BPCellColor color)
{

}
