package com.cogumelos.config;

import com.cogumelos.security.CookieOAuth2RequestRepository;
import com.cogumelos.security.JwtFilter;
import com.cogumelos.security.OAuth2SuccessHandler;
import com.cogumelos.security.TrialFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final TrialFilter trialFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CookieOAuth2RequestRepository cookieOAuth2RequestRepository;

    public SecurityConfig(JwtFilter jwtFilter,
                          TrialFilter trialFilter,
                          @Lazy OAuth2SuccessHandler oAuth2SuccessHandler,
                          CookieOAuth2RequestRepository cookieOAuth2RequestRepository) {
        this.jwtFilter                     = jwtFilter;
        this.trialFilter                   = trialFilter;
        this.oAuth2SuccessHandler          = oAuth2SuccessHandler;
        this.cookieOAuth2RequestRepository = cookieOAuth2RequestRepository;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(c -> c.disable())
                .cors(c -> c.configurationSource(corsSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/oauth2/**",
                                "/actuator/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api/auth/esqueci-senha",
                                "/api/auth/redefinir-senha",
                                "/v3/api-docs"
                        ).permitAll()
                        .requestMatchers("/api/insumos/**", "/api/especies/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/insumos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/insumos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/insumos/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/tenants/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            String path = request.getRequestURI();
                            if (path.startsWith("/api/")) {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                response.setContentType("application/json");
                                response.getWriter().write("{\"error\":\"Não autenticado\"}");
                            } else {
                                response.sendRedirect("/oauth2/authorization/google");
                            }
                        })
                )
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(ae -> ae
                                .baseUri("/oauth2/authorization")
                                .authorizationRequestRepository(cookieOAuth2RequestRepository)
                        )
                        .redirectionEndpoint(re -> re
                                .baseUri("/api/auth/oauth2/callback/*")
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtFilter,  UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(trialFilter, JwtFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        String frontendUrls = System.getenv("FRONTEND_URLS");
        String frontendUrl  = System.getenv("FRONTEND_URL");

        List<String> origens;
        if (frontendUrls != null && !frontendUrls.isBlank()) {
            origens = Arrays.stream(frontendUrls.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
        } else if (frontendUrl != null && !frontendUrl.isBlank()) {
            origens = List.of(frontendUrl.trim());
        } else {
            origens = List.of("http://localhost:3000");
        }

        cfg.setAllowedOriginPatterns(origens);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}