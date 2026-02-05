package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class PlaidCursor
{
    private Long id;
    private Long userId;
    private String itemId;
    private String addedCursor;
    private String modifiedCursor;
    private LocalDateTime lastSyncTimestamp;
    private boolean cursorSyncSuccessful;
}
