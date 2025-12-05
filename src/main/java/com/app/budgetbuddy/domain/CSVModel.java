package com.app.budgetbuddy.domain;

import java.time.LocalDateTime;

public record CSVModel(Long id, Long userId, String name, LocalDateTime createdDate)
{

}
