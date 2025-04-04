package com.example.newSkyWay.service;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.newSkyWay.entity.Connect;
import com.example.newSkyWay.entity.User;
import com.example.newSkyWay.repository.ConnectRepository;
import com.example.newSkyWay.repository.UserRepository;
import com.example.newSkyWay.request.ConnectRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConnectService {
	
	private final ConnectRepository connectRepository;
	private final UserRepository userRepository;
		
	@Transactional
	public void setConnect(ConnectRequest connectRequest) {
		User user = this.userRepository.getReferenceById(connectRequest.getUserId());
		Connect connect = this.connectRepository.findByMemberId(connectRequest.getMemberId());
		
		if(connect == null) connect = new Connect(); 
		connect.setUser(user);
		connect.setRoomName(connectRequest.getRoomName());
		connect.setRoomId(connectRequest.getRoomId());
		connect.setMemberId(connectRequest.getMemberId());
		connect.setVideoFlg(connectRequest.isVideoFlg());
		connect.setVideoId(connectRequest.getVideoId());
		connect.setAudioFlg(connectRequest.isAudioFlg());
		connect.setAudioId(connectRequest.getAudioId());
		
		this.connectRepository.save(connect);
	}

}
