package com.app.budgetbuddy.domain;

import java.util.List;

public record BPLayout(List<BPColumn> columns, List<BPRow> rows) { }
