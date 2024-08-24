package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AuthenticationResponse;
import com.app.budgetbuddy.workbench.JWTUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService implements AuthenticationProvider
{
    private UserService userService;
    private UserDetailsService userDetailsService;
    private PasswordEncoder passwordEncoder;
    private JWTUtil jwtUtil;
    private Logger LOGGER = LoggerFactory.getLogger(AuthenticationService.class);

    @Autowired
    public AuthenticationService(UserService userService, UserDetailsService userDetailsService, JWTUtil jwtUtil){
        this.userService = userService;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }


    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = authentication.getName();
        String password = authentication.getCredentials() != null ? authentication.getCredentials().toString() : null;
        LOGGER.info("Password: " + password);
        LOGGER.info("Username: " + username);
        if(password == null )
        {
            LOGGER.error("Password is null");
        }
        UserDetails userDetails = loadUserDetails(authentication.getName());

        if (userDetails == null || !passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }

        return new UsernamePasswordAuthenticationToken(userDetails, password, userDetails.getAuthorities());
    }

    public AuthenticationResponse createAuthenticationResponse(String username, String password) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(username, password);
        Authentication authenticatedUser = authenticate(authentication);

        UserDetails userDetails = (UserDetails) authenticatedUser.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);
        return new AuthenticationResponse(token, "Bearer", userDetails.getUsername(), userDetails.getAuthorities());
    }

    public UserDetails loadUserDetails(String username)
    {
        return userDetailsService.loadUserByUsername(username);
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
