package com.example.newSkyWay.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {
	
	@Bean
	protected SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.
			authorizeHttpRequests(request -> request
					.requestMatchers("/login").permitAll()
					.anyRequest().authenticated()
			)
			.formLogin(login -> login
					.loginPage("/login")
					.loginProcessingUrl("/login")
					.defaultSuccessUrl("/")
					.failureUrl("/login?error")
					.usernameParameter("userName")
					.passwordParameter("password")
					.permitAll()
			)
			.logout(logout -> logout
					.logoutSuccessUrl("/login")
					.permitAll()
			);
		
		return http.build();
	}
	
	@Bean
	protected PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
