package com.app.budgetbuddy.domain;

import lombok.Builder;

@Builder
public record EnvelopeNotificationStatus(Long notificationId, Boolean isRead, Boolean isAccepted, String status) {
}
