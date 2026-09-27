package com.app.budgetbuddy.domain;

import java.time.LocalDate;

public record MoveFuturePointerRequest(LocalDate currentPointerDate, LocalDate newPointerDate, Long templateDetailId) {
}
