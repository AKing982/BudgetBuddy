//package com.app.budgetbuddy.config;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.context.annotation.Primary;
//import org.springframework.context.annotation.Profile;
//import org.springframework.data.redis.connection.RedisConnectionFactory;
//import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
//import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
//import org.springframework.data.redis.serializer.StringRedisSerializer;
//import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
//
//import java.net.URI;
//import java.net.URISyntaxException;
//
//@Configuration
//@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800,
//redisNamespace = "budgetbuddy:session")
//@Profile("heroku")
//public class HerokuRedisConfig
//{
//    @Value("${spring.data.redis.url:#{null}}")
//    private String redisUrl;
//
//    @Bean
//    public RedisConnectionFactory redisConnectionFactory() {
//        if (redisUrl != null && redisUrl.startsWith("redis://")) {
//            // Parse Heroku Redis URL format: redis://h:password@hostname:port
//            try {
//                URI redisUri = new URI(redisUrl);
//
//                RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
//                config.setHostName(redisUri.getHost());
//                config.setPort(redisUri.getPort());
//
//                if (redisUri.getUserInfo() != null) {
//                    String[] userInfo = redisUri.getUserInfo().split(":");
//                    if (userInfo.length > 1) {
//                        config.setPassword(userInfo[1]);
//                    }
//                }
//
//                // Heroku Redis requires SSL
//                LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
//                factory.setUseSsl(true);
//                factory.setVerifyPeer(false); // Heroku Redis certificate verification
//
//                return factory;
//            } catch (URISyntaxException e) {
//                throw new RuntimeException("Invalid Redis URL format", e);
//            }
//        } else {
//            // Fallback to default configuration
//            return new LettuceConnectionFactory(new RedisStandaloneConfiguration("localhost", 6379));
//        }
//    }
//
//    @Bean
//    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
//        RedisTemplate<String, Object> template = new RedisTemplate<>();
//        template.setConnectionFactory(connectionFactory);
//
//        // Use JSON serialization for better compatibility
//        template.setDefaultSerializer(new GenericJackson2JsonRedisSerializer());
//        template.setKeySerializer(new StringRedisSerializer());
//        template.setHashKeySerializer(new StringRedisSerializer());
//        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
//        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
//
//        template.afterPropertiesSet();
//        return template;
//    }
//}
//
