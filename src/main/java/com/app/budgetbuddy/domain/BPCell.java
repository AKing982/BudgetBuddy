package com.app.budgetbuddy.domain;

@Deprecated
public record BPCell(BPColumn column, double amount, boolean isOverSpend, boolean isEstimated, boolean isEditable, boolean isPercentage, BPCellColor color)
{

}
