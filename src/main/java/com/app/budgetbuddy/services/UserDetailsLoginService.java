package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.SecurityUser;
import com.app.budgetbuddy.entities.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class UserDetailsLoginService implements UserDetailsService
{
    private UserService userService;
    private Logger LOGGER = LoggerFactory.getLogger(UserDetailsLoginService.class);

    @Autowired
    public UserDetailsLoginService(UserService userService){
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Pattern emailPattern = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");
        Matcher matcher = emailPattern.matcher(username);
        if(matcher.matches())
        {
            Optional<UserEntity> user = userService.findByEmail(username);
            if(user.isPresent())
            {
                UserEntity userEntity = user.get();
                return getUserDetails(userEntity);
            }
        }
        UserEntity userEntity = userService.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return getUserDetails(userEntity);
    }

    private SecurityUser getUserDetails(UserEntity user)
    {
        SecurityUser securityUser = new SecurityUser(user);
        LOGGER.info("Getting User info: {}", user);
        LOGGER.info("SecurityUser: {}", securityUser);
        return securityUser;
    }
}
