package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
@AllArgsConstructor(access=AccessLevel.PUBLIC)
@Builder
@ToString
public class BPTemplateDetail
{
    private Long id;
    private Long templateId;
    private BPLayoutGrid layoutGrid;
    private BPLayoutType layoutType;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;
}
