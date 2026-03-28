package com.app.budgetbuddy.domain;

import java.util.List;

public record BPRow(String category, CategoryType categoryType, List<BPCell> bpCells)
{

}
