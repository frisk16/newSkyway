package com.example.newSkyWay.request;

import lombok.Data;

@Data
public class ConnectRequest {
	
	private Integer id;
	private Integer userId;
	private String roomName;
	private String roomId;
	private String memberId;
	private boolean videoFlg;
	private String videoId;
	private boolean audioFlg;
	private String audioId;

}
