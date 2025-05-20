package com.app.budgetbuddy.workbench;


import java.security.SecureRandom;


public class PasswordValidationServiceImpl implements PasswordValidationService
{
    private static final SecureRandom random = new SecureRandom();
    private static final int CODE_LENGTH = 6;

    @Override
    public String generateValidationCode()
    {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++)
        {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
}
