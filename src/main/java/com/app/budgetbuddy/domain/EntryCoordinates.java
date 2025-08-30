package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.domain.math.Coordinate;

import java.util.List;

@Deprecated
public record EntryCoordinates(EntryType entry, List<Coordinate> entryCoordinates) { }
