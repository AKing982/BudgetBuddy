package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidCursor;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PlaidCursorToEntityConverter implements Converter<PlaidCursor, PlaidCursorEntity>
{
    private final UserService userService;

    @Autowired
    public PlaidCursorToEntityConverter(UserService userService)
    {
        this.userService = userService;
    }

    @Override
    public PlaidCursorEntity convert(PlaidCursor plaidCursor)
    {
        Long userId = plaidCursor.getUserId();
        UserEntity userEntity = userService.findById(userId)
                .orElse(null);
        return PlaidCursorEntity.builder()
                .cursor(plaidCursor.getAddedCursor())
                .cursorSyncSuccessful(plaidCursor.isCursorSyncSuccessful())
                .user(userEntity)
                .lastSyncTimestamp(plaidCursor.getLastSyncTimestamp())
                .id(plaidCursor.getId())
                .itemId(plaidCursor.getItemId())
                .build();
    }
}
