package com.example.newSkyWay.entity;

import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "connects")
@Data
public class Connect {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Integer id;
	
	@ManyToOne
	@JoinColumn(name = "user_id")
	private User user;
	
	@Column(name = "room_name")
	private String roomName;
	
	@Column(name = "room_id")
	private String roomId;
	
	@Column(name = "member_id")
	private String memberId;
	
	@Column(name = "video_flg")
	private boolean videoFlg;
	
	@Column(name = "video_id")
	private String videoId;
	
	@Column(name = "audio_flg")
	private boolean audioFlg;
	
	@Column(name = "audio_id")
	private String audioId;
	
	@Column(name = "created_at", insertable = false, updatable = false)
	private Timestamp createdAt;
	
	@Column(name = "updated_at", insertable = false, updatable = false)
	private Timestamp updatedAt;
	
}
