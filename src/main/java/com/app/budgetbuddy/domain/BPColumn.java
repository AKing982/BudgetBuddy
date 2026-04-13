package com.app.budgetbuddy.domain;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@ToString
public class BPColumn
{
    private int columnIndex;
    private DateRange dateRange;
    private Period period;
    private BPColumnType columnType;
    private boolean isHeader;

}
