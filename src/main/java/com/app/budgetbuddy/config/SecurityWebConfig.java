package com.app.budgetbuddy.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.EnableGlobalAuthentication;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebSecurity
@EnableGlobalAuthentication
@Profile("!heroku")
public class SecurityWebConfig
{
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .authorizeHttpRequests(authorize -> authorize
                        // Allow all requests to /api/ and all its subpaths
//                        .requestMatchers("/api/auth/**").permitAll()
//                        .requestMatchers("/api/**").authenticated()
                        // Allow all other requests as well
                        .anyRequest().permitAll())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .exceptionHandling(exception -> exception
                        // Handle unauthenticated users (401)
                        .authenticationEntryPoint(authenticationEntryPoint())
                        // Handle authenticated but unauthorized users (403)
                        .accessDeniedHandler(accessDeniedHandler()));

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"You must be logged in to access this resource\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"You don't have permission to access this resource\"}");
        };
    }

    @Bean
    public WebMvcConfigurer corsConfigurer()
    {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {

                registry.addMapping("/csrf/token")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET")
                        .allowedHeaders("*")
                        .allowCredentials(true);

                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);

                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST")
                        .allowedHeaders("*")
                        .allowCredentials(true);

                registry.addMapping("/ws/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST")
                        .allowedHeaders("*")
                        .allowCredentials(true);


            }
        };


    }
}
