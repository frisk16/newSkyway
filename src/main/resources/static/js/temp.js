/**
 * 20220912 skyway 機能
 */
let _localStream = null;
let _room = null;
let _myPeerId = null;
let _userAgent = null;
let cameraFlg = null;
let micFlg = null;
let errflg = false;
const isMobile = /Android|iPhone|iPad|ios/.test(navigator.userAgent);
let videoType = "environment";
let getUserMediaInProgress = false;
/* MediaRecorder를 밖에서 제어하기 위해 변수 생성 */
let mediaRecorder = null;
let audioRecorder = null;
let mediaDataUrl = null;


/**
 * navigator.mediaDevices.getUserMedia 설정해주는 함 수
 * 처음로그인 할때나 카메라나 오디오 설정 바꿀때 사용
 * firstLogin 첫로그인 플러그 true:첫로그인  첫로그인시 뒷화면을 잡아줘야해서 플러그 넘김
 */
function setLocalStream(firstLogin){
	if (getUserMediaInProgress) {
		// 필요에 따라 이미 실행 중인 경우에 대한 처리를 수행할 수 있습니다.
		return Promise.reject("getUserMedia is already in progress");
	}
	setDevicesList(); //ユーザーDevicesリスト作成 & デバイス設定内にメディアデータを挿入
	videoRecordStop(); //既にレコードが開始されている場合はレコードを停止する

	var constraints = null;

	if(firstLogin){	
		// メディアデータ（マイク、カメラ、画質）を取得
		if(isMobile && 0 === $('#videoSource option[value="user"]').length){
			let mobileCamera = $('<option>').val("user");
			mobileCamera.text("前面カメラ");
			$('#videoSource').append(mobileCamera);
			mobileCamera = $('<option>').val("environment");
			mobileCamera.text("背面カメラ");
			$('#videoSource').append(mobileCamera);
		}
		
		// DBから現在のカメラ、マイクステータスを取得
		$.ajax({
	    	type: "POST",
	        url: "./getCameraFlg",
	        dataType: "json",
	        cache: false,
	        scriptCharset: 'utf-8',
	        async: false,
	        data: {
	        	userNo: _userNo
	        	
	        },
	        success: function(status) {
				cameraFlg = status.cameraFlg;
				micFlg = status.micFlg;
	        }, error: function(XMLHttpRequest, textStatus, errorThrown) {
	            //통신에러
	            console.log(XMLHttpRequest);
	            console.log(textStatus);
	            console.log(errorThrown);
	        }
	    });
		//カメラデフォルト設定（DBを元にアイコンステータス等を更新）
		getUserSelectCamera();
		return;
	}
	
	// local media 起動フラグ
	getUserMediaInProgress = true;
	
	// 既にトラックデータがある場合は一度停止
	if(_localStream != null){
		_localStream.getTracks().forEach(track => track.stop());
	}
	
	if(errflg){
		constraints = { video: false,
			audio: {
				echoCancellation : true,
				echoCancellationType : 'system',
				noiseSuppression : true
			} };
	} else{
		// 「LIVE映像設定」のオプションデータを代入
		constraints = setConstraints();
	}

	// 設定を元にメディアを起動
	return navigator.mediaDevices.getUserMedia(constraints).then(stream => {
		getUserMediaInProgress = false;
		//카메라 또는 마이크가 꺼졌있을떄 꺼진 상태로 로드 시켜줌
		if($("#btn_cameraOnOff").hasClass("btn-secondary") && $("#btn_micOnOff").hasClass("btn-secondary")) { //카메라 마이크 둘다 꺼져있을때
			stopBothVideoAndAudio(stream); // ビデオ、マイク停止
			if(firstLogin){
				return;
			}
		} else if($("#btn_cameraOnOff").hasClass("btn-primary") && $("#btn_micOnOff").hasClass("btn-secondary")) { //카메라만 켜져있을떄
			stopAudioOnlyVideo(stream); // ビデオのみ
		} else if($("#btn_cameraOnOff").hasClass("btn-secondary") && $("#btn_micOnOff").hasClass("btn-primary")) { //마이크만 켜져있을때
			stopVideoOnlyAudio(stream);　// マイクのみ
		}

		// ビデオ映像出力
		const videoElm = document.getElementById('my-video');
		videoElm.srcObject = stream;
		//videoElm.play().catch((err) => alert(err));

		// 着信時に相手にカメラ映像を返せるように、グローバル変数に保存しておく
		_localStream = stream;

		if(!errflg){
			// 2. 옵션 설정 및 MediaRecorder 객체 생성
			let options = {};
			if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
				options = {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/webm; codecs=vp9'};
			} else  if (MediaRecorder.isTypeSupported('video/webm')) {
				options = { audioBitsPerSecond: 64000, videoBitsPerSecond: 320000 ,mimeType: 'video/webm'};
			} else if (MediaRecorder.isTypeSupported('video/mp4')) {
				options = {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/mp4'};
			} else {
				console.error("no suitable mimetype found for this device");
			}

			// レコード開始
			mediaRecorder = new MediaRecorder(_localStream, options);
			// 3. 녹화/녹음 시작
			mediaRecorder.start(); 
			console.log("videoRecord Start...");
			// 입력받은 미디어 데이터를 저장할 배열
			let mediaData = [];
			// 4. dataavailable 이벤트 핸들러 등록 : 녹음/녹화가 시작된 이후, 이용 가능한 미디어 데이터가 들어올 때마다 발생
			mediaRecorder.ondataavailable = function(event) {
				console.log("ondataavailable");
				/* 입력받은 미디어 데이터를 저장 */
				if(event.data && event.data.size > 0) {
					mediaData.push(event.data);
				}
			}


//    	console.log("mediaRecorder.start()");

			// レコード停止時、日付、レコードデータ等をDBへ送信する
			// 5. stop 이벤트 핸들러 등록 : 녹화/녹음이 종료(중지)됐을 때 발생
			mediaRecorder.addEventListener('stop', function () {
				mediaRecorder.stop();
				let endTime = Date.now();
				if(buttonName != "camera"){
					$('#spinner-div').show();
				}
				/* 미디어 데이터를 저장해둔 배열을 이용하여 처리할 내용 */
				var extType = "";
				if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
					extType = "video/webm";
				} else  if (MediaRecorder.isTypeSupported('video/webm')) {
					extType = "video/webm";
				} else if (MediaRecorder.isTypeSupported('video/mp4')) {
					extType = "video/mp4";
				} else {
					console.error("no suitable mimetype found for this device");
				}
				let blob = new Blob(mediaData, {type: extType});

				/* 서버로 전송 */
				let formdata = new FormData();
				formdata.append("fname", "recordingVideo.webm");
				formdata.append("data", blob);
				formdata.append("userNo", _userNo);
				formdata.append("roomNo", _roomNo);

				$.ajax({
					url: "./recordingVideo",
					type: "POST",
					contentType: false,
					processData: false,
					data: formdata,
					async: true,
					success: function (data) {

					},
					error: function (errorMessage) {
						console.log("Error" + errorMessage);
					},
				}).done(function (data) {

					if(buttonName == "logout"){
						setTimeout(function () {recLogOut();},6000);
					} else if(buttonName == "genbaMode"){
						setTimeout(function () {recGenbaMode();},1000);
					} else if(buttonName == "telop"){
						setTimeout(function () {recTelop();},1000);
					} else if(buttonName === "keyChange"){
						setTimeout(function () {location.reload();},6000);
					}
					buttonName = "camera";
				});
				console.log("video stop event");
			});
			let recordStartTime = Date.now();
		}

		if(_room){
			_room.replaceStream(stream);
			return;
		}
		
		// ルーム参加
		//_room = peer.joinRoom('sfu_video_144857007025', {
		_room = peer.joinRoom(_skywayRoomID, {
			mode: 'sfu',
			stream: _localStream
		});

		// ルーム作成時の処理
		//자기자신이 룸에 들어왔을떄
		_room.on('open', stream => {
			
		});

		// ルーム退室時の処理
		// 자신이 룸을 닫았을때
	    _room.once('close', () => {
			var audio = new Audio('./sound/reload.mp3');
			audio.play();
			errorLocationAjax(_roomNo,_userNo);
			// audio.addEventListener("ended",window.location.reload(true));
	    	// alert('通信中にエラーが発生しました。\n画面をリロードします。');
	    	window.location.reload(true);
	    });

		// 他のユーザーが入室した時の処理
		//다른 사람이 룸에 들어왔을때
		_room.on('peerJoin', peerId => {
			
	    });

		// 他のユーザーのstreamデータを取得
		//스트림 받아와서 뿌려줌
		_room.on('stream', stream => {
			addPeerVideo(stream);
			
		});

		// 他のユーザーが退室した時の処理
		//다른 사람이 룸을 떠났을때
		_room.on('peerLeave', peerId => {
			document.getElementById("li_"+ peerId).remove();
	    });


		//画面を閉じる時基本設定に戻る
    	//カメラON　マイクOFF　quality null
//		setCmeraAndMicAndQuality(cameraFlg, micFlg, null);
		if(cameraFlg == 0){
			cameraBtnClick(false);
		}else{
			// videoRecordStart();
		}
		if(micFlg == 0){
			$("#btn_micOnOff").removeClass("btn-primary");
			$("#btn_micOnOff").addClass("btn-secondary");
			$("#btn_micOnOff").text("マイクOFF");
			$("#div_micOnOff").css("display", "none");
			setLocalStream(false);
			//カメラnull　マイクOFF　quality null
			setCmeraAndMicAndQuality(2, 0, null);
		}
//		else{
//			audioRecordStart();
//		}

		if(!errflg && $("#btn_cameraOnOff").hasClass("btn-primary")) { //카메라 켜져있을떄
			// videoRecordStart();
		}
		setDevicesList(); //ユーザーDevicesリスト作成
		//setCmeraAndMicAndQuality(1, 0, null);
		//20221207 37번프로젝트 요청으로 촬영모드 진입시 초기 화질 中으로 세팅
    	//setCmeraAndMicAndQuality(1, 0, "中");
		//$("#cameraQuality").val("中*400*240").prop("selected", true);
	}).catch( error => {
		getUserMediaInProgress = false;
	    //画面を閉じる時基本設定に戻る
	    //カメラOFF　マイクON　quality null
		//setCmeraAndMicAndQuality(0, 0, null);
		//20221207 37번프로젝트 요청으로 촬영모드 진입시 초기 화질 中으로 세팅 기존 값은 高
	    //setCmeraAndMicAndQuality(0, 0, "中");
		//$("#cameraQuality").val("中*400*240").prop("selected", true);
		// 失敗時にはエラーログを出力
		if(error.message === "Failed to execute 'start' on 'MediaRecorder': There was an error starting the MediaRecorder."){
			errflg = false;
		} else if(!(error.message === "Could not start video source" || error.message === "Device in use") && $("#videoSource option").length === 0){
			if($("#audioSource option").length === 0){
				errflg = true;
				setCmeraAndMicAndQuality(0,0, null);
				$("#btn_cameraOnOff").removeClass("btn-primary");
				$("#btn_cameraOnOff").addClass("btn-secondary");
				$("#btn_cameraOnOff").text("カメラOFF");
				$("#div_cameraOnOff").css("display", "none");
				$("#my-video-text").css("display", "block");
				$("#my-video").css("display", "none");
				$("#btn_micOnOff").removeClass("btn-primary");
				$("#btn_micOnOff").addClass("btn-secondary");
				$("#btn_micOnOff").text("マイクOFF");
				$("#div_micOnOff").css("display", "none");
			}else{
				setLocalStream(false);
			}
		}else {
			alert("カメラを確認してください。");
			errflg = true;
			setCmeraAndMicAndQuality(0,0, null);
//	  	  	setLocalStream(true);
			$("#btn_cameraOnOff").removeClass("btn-primary");
			$("#btn_cameraOnOff").addClass("btn-secondary");
			$("#btn_cameraOnOff").text("カメラOFF");
			$("#div_cameraOnOff").css("display", "none");
			$("#my-video-text").css("display", "block");
			$("#my-video").css("display", "none");

			$("#btn_micOnOff").removeClass("btn-primary");
			$("#btn_micOnOff").addClass("btn-secondary");
			$("#btn_micOnOff").text("マイクOFF");
			$("#div_micOnOff").css("display", "none");
		}
		console.log('mediaDevice.getUserMedia() error:', error);
		
	});
}

	
////////////////////////////////////
// * 화상채팅에 사용될 constraints를 생성
// * firstLogin 첫로그인 플러그 true:첫로그인  첫로그인시 뒷화면을 잡아줘야해서 플러그 넘김
// * 「LIVE映像設定」で選択したメディアデータ（マイク、カメラ、画質）の情報をオプションにして返す
////////////////////////////////////	
function setConstraints(){
	const audioSource = $('#audioSource').val();
    const videoSource = $('#videoSource').val();
    const constraintsSize = $('#cameraQuality').val().split("*");
    const constraintsName = constraintsSize[0];
    const constraintsWidth = constraintsSize[1];
    const constraintsHeight = constraintsSize[2];

	if(isMobile){
		$('#videoSource').val(videoType).prop("selected",true);
		if(constraintsName == "上"){
			constraints = {
				audio: {
					deviceId: audioSource ? {
						exact: audioSource
					} : undefined,
					echoCancellation : true,
					echoCancellationType : 'system',
					noiseSuppression : true
				},
				video: {
					facingMode: videoType
				}
			};
		} else {
			constraints = {
				audio: {
					deviceId: audioSource ? {
						exact: audioSource
					} : undefined,
					echoCancellation : true,
					echoCancellationType : 'system',
					noiseSuppression : true
				},
				video: {
					facingMode: videoType
					,width: {
						max: constraintsWidth,
					},
					height: {
						max: constraintsHeight,
					}
				}
			};
		}
	}else{
		if(constraintsName == "上"){
			constraints = {
				audio: {
					deviceId: audioSource ? {
						exact: audioSource
					} : undefined,
					echoCancellation : true,
					echoCancellationType : 'system',
					noiseSuppression : true
				},
				video: {
					deviceId: videoSource ? {
						exact: videoSource
					} : undefined
				}
			};
		} else {
			constraints = {
				audio: {
					deviceId: audioSource ? {
						exact: audioSource
					} : undefined,
					echoCancellation : true,
					echoCancellationType : 'system',
					noiseSuppression : true
				},
				video: {
					deviceId: videoSource ? {
						exact: videoSource
					} : undefined
					,width: {
						max: constraintsWidth,
					},
					height: {
						max: constraintsHeight,
					}
				}
			};
		}
	}
    
    return constraints;
}


////////////////////////////////////
// * 오디오, 카메라 리스트 생성
// * ビデオ、マイクデータを読み取り設定画面にオプションを追加
////////////////////////////////////	
function setDevicesList(){
        navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
        // 디바이스 리스트목록에 추가
        for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            const option = $('<option>').val(deviceInfo.deviceId);

            if (deviceInfo.kind === 'audioinput') {
				if(deviceInfo.deviceId != "default" && deviceInfo.deviceId != "communications"){
					if(0 == $('#audioSource option[value='+deviceInfo.deviceId+']').length){ //이미 있는 값은 저장 안함
						option.text(deviceInfo.label || 'Microphone ' + ($('#audioSource').children().length + 1));
	                	$('#audioSource').append(option);
					}
				}
            } else if (!errflg && deviceInfo.kind === 'videoinput') {
				if(!isMobile && 0 == $('#videoSource option[value='+deviceInfo.deviceId+']').length){ //이미 있는 값은 저장 안함
	                option.text(deviceInfo.label || 'Camera ' + ($('#videoSource').children().length + 1));
	                $('#videoSource').append(option);
	            }
			}
		}
    })
	.catch(function(err) { // エラー発生時
	 	console.error('enumerateDevide ERROR:', err);
	});
   
}

// カメラ、マイクのID、フラグステータスを取得し、それを元に設定やアイコン情報を更新
function getUserSelectCamera(){
    $.ajax({
            type: "POST",
            url: "./getUserSelectCamera",
            dataType: "json",
            cache: false,
            scriptCharset: 'utf-8',
            async: true,
            data: {
            	userNo: _userNo
            },
            success: function(status) {
               	//pc以外　バックカメラをデフォルトにする。
				if(status.userSelectCamera != null && status.userSelectCamera != ''){
					if(isMobile){
						if(status.userSelectCamera === "environment" || status.userSelectCamera === "user"){
							videoType = status.userSelectCamera;
						}
					}
					var hasValue = false;
					//기존장비가 아직 유효한지 확인
					// 現在使用中のカメラをselect
					$('#videoSource > option').each(function(){
					    if (this.value == status.userSelectCamera) {
							if(!isMobile){
								//이전 선택값 디폴트값으로 저장
								$('#videoSource').val(status.userSelectCamera).prop("selected",true);
								// setLocalStream(false);
							}
							hasValue = true;
					    }
					});
					//기존장비가 유효하지 않을때
					if(!isMobile && !hasValue){
						$("#videoSource option:eq(0)").prop("selected",true);
						// setLocalStream(false);
						//선택값 저장
						saveCameraSelect();
					}
				
					
				}else {
					if(_userAgent != "pc" && _userAgent != ""){
							var videoSourceSize = $("#videoSource option").length -1 ;
							$("#videoSource option:eq(" + videoSourceSize + ")").prop("selected",true);
							// setLocalStream(false);
					} else {
							$("#videoSource option:eq(0)").prop("selected",true);
							// setLocalStream(false);
					}
					//선택값 저장
					saveCameraSelect();
				}
				
				if(status.userSelectMic != null && status.userSelectMic != ''){
					var micHasValue = false;
					$('#audioSource > option').each(function(){
					    if (this.value == status.userSelectMic) {
							$('#audioSource').val(status.userSelectMic).prop("selected",true);
//							setLocalStream(false);
							micHasValue = true;
					    }
					});
					
						if(!micHasValue){
						$("#audioSource option:eq(0)").prop("selected",true);
						// setLocalStream(false);
						//선택값 저장
						saveMicSelect();
					}
				} else {
					if(_userAgent != "pc" && _userAgent != ""){
							var audioSourceSize = $("#audioSource option").length -1 ;
							$("#audioSource option:eq(" + audioSourceSize + ")").prop("selected",true);
							// setLocalStream(false);
					} else {
							$("#audioSource option:eq(0)").prop("selected",true);
							// setLocalStream(false);
					}
					//선택값 저장
					saveMicSelect();
				}
				
				if(status.cameraQuality =="上"){
					$("#cameraQuality option:eq(0)").prop("selected",true);
					setCmeraAndMicAndQuality(2, 2, "上");
				}else if(status.cameraQuality =="中"){
					$("#cameraQuality option:eq(1)").prop("selected",true);
					setCmeraAndMicAndQuality(2, 2, "中");
				}else if(status.cameraQuality =="下"){
					$("#cameraQuality option:eq(2)").prop("selected",true);
					setCmeraAndMicAndQuality(2, 2, "下");
				}
				
				if(status.micFlg == 1){ //on :1 // off:0
					$("#btn_micOnOff").removeClass("btn-secondary");
					$("#btn_micOnOff").addClass("btn-primary");
					$("#btn_micOnOff").text("マイクON");
    				$("#div_micOnOff").css("display", "block");
					setCmeraAndMicAndQuality(2, 1, null);
				}else{
					$("#btn_micOnOff").removeClass("btn-primary");
					$("#btn_micOnOff").addClass("btn-secondary");
					$("#btn_micOnOff").text("マイクOFF");
					$("#div_micOnOff").css("display", "none");
					setCmeraAndMicAndQuality(2, 0, null);
				}
				if(status.speakerOnOffFlg == 0){ // on :1 off:0
					$("#btn_speakerOnOff").removeClass("btn-primary");
					$("#btn_speakerOnOff").addClass("btn-secondary");
					$("#btn_speakerOnOff").text("スピーカーOFF");
					$(".allPeerVideo").prop('muted', true);
				}else{
					$("#btn_speakerOnOff").removeClass("btn-secondary");
					$("#btn_speakerOnOff").addClass("btn-primary");
					$("#btn_speakerOnOff").text("スピーカーON");
					$(".allPeerVideo").prop('muted', false);
				}
				setLocalStream(false);
        }, error: function(XMLHttpRequest, textStatus, errorThrown) {
            //통신에러
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
			setLocalStream(false);
        }
    });
}

// ビデオメディア情報をDBへ送信
function saveCameraSelect(){
	$.ajax({
            type: "POST",
            url: "./setUserSelectCamera",
            dataType: "json",
            cache: false,
            scriptCharset: 'utf-8',
            async: true,
            data: {
            	userNo: _userNo,
            	userSelectCamera: $('#videoSource').val()
            	
            },
            success: function(status) {
	            if(!status){
	               //저장에러
	               alert("通信中にエラーが発生しました。");
	            }
        }, error: function(XMLHttpRequest, textStatus, errorThrown) {
            //통신에러
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
}

// オーディオメディアデータをDBへ送信
function saveMicSelect(){
	$.ajax({
            type: "POST",
            url: "./setUserSelectMic",
            dataType: "json",
            cache: false,
            scriptCharset: 'utf-8',
            async: true,
            data: {
            	userNo: _userNo,
            	userSelectMic: $('#audioSource').val()
            	
            },
            success: function(status) {
	            if(!status){
	               //저장에러
	               alert("通信中にエラーが発生しました。");
	            }
        }, error: function(XMLHttpRequest, textStatus, errorThrown) {
            //통신에러
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
}


////////////////////////////////////
// * 참가자 있을때 뿌려줌
// * 参加ユーザー毎のビデオHTMLタグを生成
////////////////////////////////////
function addPeerVideo(stream){
	var peerId = stream.peerId;

	var addPeerHtml =
		'<li id="li_' + peerId + '" style="float: left; display: none;">' +
            '<div class="pointPageDiv">' +
            	//'<p>' + peerId + '</p>' +
				'<video id="userVideo_' + peerId + '" class="allPeerVideo" width="100px" autoplay playsinline ></video>' +
			'</div>' +
		'</li>';
		
	$("#videoTbUi").append(addPeerHtml);
	
	const peerVideo = document.getElementById("userVideo_" + peerId);
	peerVideo.srcObject = stream;
	
	$.ajax({
            type: "POST",
            url: "./getUserSpeaker",
            dataType: "json",
            cache: false,
            scriptCharset: 'utf-8',
            async: true,
            data: {
            	userNo: _userNo
            },
            success: function(status) {
	           //	  	//スピーカーON
			setTimeout(() => {
				if(status.speakerOnOffFlg == 1) {        	
					$(".allPeerVideo").prop('muted', false);
					$("#btn_speakerOnOff").removeClass("btn-secondary");
					$("#btn_speakerOnOff").addClass("btn-primary");
		    		$("#btn_speakerOnOff").text("スピーカーON");
				} else { //スピーカーOFF
					$(".allPeerVideo").prop('muted', true);
					$("#btn_speakerOnOff").removeClass("btn-primary");
					$("#btn_speakerOnOff").addClass("btn-secondary");
					$("#btn_speakerOnOff").text("スピーカーOFF");
				}
			}, "1000")	
			    		
        }, error: function(XMLHttpRequest, textStatus, errorThrown) {
            //통신에러
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
	
	peerVideo.play();
}
	
	
////////////////////////////////////
// * 화면공유 시작
////////////////////////////////////
function startScreenShare(){
    navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true
    	}).then(stream => {

    	$('#1_detail_screen-videos').get(0).srcObject = stream;

        
        //todo 화면공유 소켓

    }).catch(e => {
        console.log("e: ", e);
    });
}

	
// stop both Audio and video
function stopBothVideoAndAudio(stream) {
    stream.getTracks().forEach(function(track) {
        if (track.readyState == 'live') {
            track.stop();
        }
    });
}

// stop Audio - only video ビデオのみ
function stopAudioOnlyVideo(stream) {
    stream.getTracks().forEach(function(track) {
        if (track.readyState == 'live' && track.kind === 'audio') {
            track.enabled = false;
        }
    });
}

// stop video - only Audio　マイクのみ
function stopVideoOnlyAudio(stream) {
    stream.getTracks().forEach(function(track) {
        if (track.readyState == 'live' && track.kind === 'video') {
            track.enabled = false;
        }
    });
}

// レコード開始処理
var buttonName = "camera";
function videoRecordStart(){
	console.log("videoRecordStart...");
	// 1. 미디어 데이터 소스 얻기
	navigator.mediaDevices.getUserMedia(setConstraints())
	.then(function(_localStream) {

		const videoTrack = _localStream.getVideoTracks()[0];
	    // 트랙 활성화 여부 확인
	    while (true){
			if (videoTrack.enabled) {
//		      console.log("videoTrack enabled");
		      break;
		    }
		    sleep(1000);
		}

	    // 입력받은 미디어 데이터를 저장할 배열
	    let mediaData = [];

	    // 2. 옵션 설정 및 MediaRecorder 객체 생성
		var options ="";
		if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
		     options = {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/webm; codecs=vp9'};
		} else  if (MediaRecorder.isTypeSupported('video/webm')) {
		     options = { audioBitsPerSecond: 64000, videoBitsPerSecond: 320000 ,mimeType: 'video/webm'};
		} else if (MediaRecorder.isTypeSupported('video/mp4')) {
			 options = {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/mp4'};
		} else {
		    console.error("no suitable mimetype found for this device");
		}

	    mediaRecorder = new MediaRecorder(_localStream, options);

	    // 3. dataavailable 이벤트 핸들러 등록 : 녹음/녹화가 시작된 이후, 이용 가능한 미디어 데이터가 들어올 때마다 발생
	    mediaRecorder.ondataavailable = function(event) {
	        /* 입력받은 미디어 데이터를 저장 */
	        if(event.data && event.data.size > 0) {
	            mediaData.push(event.data);
	        }
	    }

        // 4. 녹화/녹음 시작
    	mediaRecorder.start();
//    	console.log("mediaRecorder.start()");

	    // 5. stop 이벤트 핸들러 등록 : 녹화/녹음이 종료(중지)됐을 때 발생
	    mediaRecorder.addEventListener('stop', function () {

			let endTime = Date.now();
			if(buttonName != "camera"){
				$('#spinner-div').show();
			}
	        /* 미디어 데이터를 저장해둔 배열을 이용하여 처리할 내용 */
	        var extType = "";
	        if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
				extType = "video/webm";
			} else  if (MediaRecorder.isTypeSupported('video/webm')) {
			    extType = "video/webm";
			} else if (MediaRecorder.isTypeSupported('video/mp4')) {
				extType = "video/mp4";
			} else {
			    console.error("no suitable mimetype found for this device");
			}
			const blob = new Blob(mediaData, {type: extType});

			/* 서버로 전송 */
			let formdata = new FormData();
		    formdata.append("fname", "recordingVideo.webm");
		    formdata.append("data", blob);
		    formdata.append("userNo", _userNo);
		    formdata.append("roomNo", _roomNo);

			// DBにレコードデータ送信＆停止フラグをたてる
			$.ajax({
			    url: "./recordingVideo",
			    type: "POST",
			    contentType: false,
			    processData: false,
			    data: formdata,
			    async: true,
			    success: function (data) {

			    },
			    error: function (errorMessage) {
			      console.log("Error" + errorMessage);
			    },
			}).done(function (data) {

				if(buttonName == "logout"){
					setTimeout(function () {recLogOut();},6000);
				} else if(buttonName == "genbaMode"){
					setTimeout(function () {recGenbaMode();},1000);
				} else if(buttonName == "telop"){
					setTimeout(function () {recTelop();},1000);
				} else if(buttonName === "keyChange"){
					alert("通信環境が不安定なため再度接続します。");
					location.reload();
				}
				buttonName = "camera";
			});
    		console.log("video stop event");
	    });
		let recordStartTime = Date.now();
	})
	.catch(function(error) {
	    console.log("video recoding error",error);
		if(error.message === "Could not start video source" || error.message === "Device in use"){
			if($("#btn_cameraOnOff").hasClass("btn-primary")){
				errflg = true;
				setCmeraAndMicAndQuality(0,2, null);
				$("#btn_cameraOnOff").removeClass("btn-primary");
				$("#btn_cameraOnOff").addClass("btn-secondary");
				$("#btn_cameraOnOff").text("カメラOFF");
				$("#div_cameraOnOff").css("display", "none");
				setLocalStream(false);
			}
		}
	});
}

function videoRecordStop(){
	if(mediaRecorder != null) mediaRecorder.stop();
}

// レコード停止（ログアウト）
function recLogOut(){
	$.ajax({
		 type : "POST",     // HTTP通信の種類
	     url  : "./logoutAjax",                // リクエストを送信する先のURL
	     dataType : "text",             // サーバーから返されるデータの型
	     async : true,
	     data :
	     {
	    	  'roomNo': _roomNo,
			  'jacicUserNo': _userNo
	     },  // サーバーに送信するデータ
	     error : function(XMLHttpRequest, textStatus, errorThrown) {
	        console.log(XMLHttpRequest);
	        console.log(textStatus);
	        console.log(errorThrown);
			//alert("ログアウトに失敗しました。");
	     }
	}).done(function(){
		//로그아웃 소켓오류 제어
		if(flg){
		    stompClient.disconnect();
			window.location.href = './logout';
		}
	});
}

function recGenbaMode(){
	var url_token = document.location.href;
	if (url_token.includes('?tk=')) {
		url_token = url_token.split("?tk=").reverse()[0];
		stompClient.disconnect();
		location.href = './genbaMode?tk=' + url_token;
	} else {
		stompClient.disconnect();
		location.href = './genbaMode';
	}
}

function recTelop(){
	window.localStorage.setItem("saigoPage2", "none");
	stompClient.disconnect();
	location.href = './main?openTelopFlg=1';
}
	


