package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record PostedDateInfo(long avgDaysBetween, LocalDate lastPostedDate) {
}
