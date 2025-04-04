package com.example.newSkyWay.controller;

import java.util.HashMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.newSkyWay.entity.Connect;
import com.example.newSkyWay.repository.ConnectRepository;
import com.example.newSkyWay.request.ConnectRequest;
import com.example.newSkyWay.service.ConnectService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ConnectController {
	
	private final ConnectRepository connectRepository;
	private final ConnectService connectService;
	
	@PostMapping("/insertConnect")
	public Object insertConnect(@RequestBody(required = false) ConnectRequest connectRequest) {
		HashMap<String, Object> responseBody = new HashMap<>();
		try {
			this.connectService.setConnect(connectRequest);
			responseBody.put("status", HttpStatus.OK.value());
		} catch(Exception e) {
			responseBody.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
			responseBody.put("errMsg", e.getMessage());
		}
		
		return responseBody;
	}
	
	@PostMapping("/getConnect")
	public Object getConnect(@RequestBody(required = false) ConnectRequest connectRequest) {
		HashMap<String, Object> responseBody = new HashMap<>();
		try {
			Connect connect = this.connectRepository.findByMemberId(connectRequest.getMemberId());
			responseBody.put("status", HttpStatus.OK.value());
			responseBody.put("data", connect);
		} catch(Exception e) {
			responseBody.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
			responseBody.put("errMsg", e.getMessage());
		}
		
		return responseBody;
	}

}
