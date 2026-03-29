package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class BPRow
{
    private String category;
    private CategoryType categoryType;
    private List<BPCell> cells;

    public BPRow(String category, CategoryType categoryType, List<BPCell> cells) {
        this.category = category;
        this.categoryType = categoryType;
        this.cells = cells;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BPRow bpRow = (BPRow) o;
        return Objects.equals(category, bpRow.category) && categoryType == bpRow.categoryType && Objects.equals(cells, bpRow.cells);
    }

    @Override
    public int hashCode() {
        return Objects.hash(category, categoryType, cells);
    }
}
