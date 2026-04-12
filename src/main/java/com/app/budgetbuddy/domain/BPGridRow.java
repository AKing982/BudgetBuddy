package com.app.budgetbuddy.domain;

import java.util.List;

public record BPGridRow(String category, BPType type, List<BPGridCell> cells) {
}
