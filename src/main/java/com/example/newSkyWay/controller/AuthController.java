package com.example.newSkyWay.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.example.newSkyWay.security.UserDetailsImpl;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
public class AuthController {
	
	@GetMapping("/login")
	public String loginPage(@AuthenticationPrincipal UserDetailsImpl userDetailsImpl) {
		if(userDetailsImpl != null) return "redirect:/";
		return "auth/loginPage";
	}

}
