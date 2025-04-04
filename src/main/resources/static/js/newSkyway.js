const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

const token = new SkyWayAuthToken({
	jti: uuidV4(),
	iat: nowInSec(),
	exp: nowInSec() + 60 * 60 * 24,
	version: 3,
	scope: {
		appId: "967a468e-b1ae-44b8-8510-5b25a47a55f1",
		rooms: [
			{
				name: "*",
				methods: ["create", "close", "updateMetadata"],
				member: {
					name: "*",
					methods: ["publish", "subscribe", "updateMetadata"],
				},
			},
		],
	},
}).encode("f2PkJA/G5O+UQoQrJR9RadhgdbgvTxIBZXqOnCZFZDs=");

(async () => {
	const localVideo = document.getElementById("local-video");
	const mediaForm = document.forms.mediaForm;
	const toggleVideoImg = document.getElementById("toggle-video-img");
	const toggleAudioImg = document.getElementById("toggle-audio-img");
	const videoSelectForm = document.getElementById("video-select-form");
	const audioSelectForm = document.getElementById("audio-select-form");
	const remoteMediaArea = document.getElementById("remote-media-area");
	const roomNameInput = document.getElementById("room-name");
	const myId = document.getElementById("my-id");
	const joinButton = document.getElementById("join");
	const leaveButton = document.getElementById('leave');
	const formErrorText = document.getElementById("form-error-text");
	let data = {
		userId: 0,
		roomName: "",
		roomId: "",
		memberId: "",
		videoFlg: false,
		videoId: "",
		audioFlg: false,
		audioId: ""
	};
	
	// メディアデバイス取得
	const videoDevices = await SkyWayStreamFactory.enumerateInputVideoDevices();
	const audioDevices = await SkyWayStreamFactory.enumerateInputAudioDevices();
	videoDevices.forEach(video => {
		const option = document.createElement("option");
		option.value = video.id;
		option.textContent = video.label;
		videoSelectForm.appendChild(option);
	});
	audioDevices.forEach(audio => {
		const option = document.createElement("option");
		option.value = audio.id;
		option.textContent = audio.label;
		audioSelectForm.appendChild(option);		
	});
	
	joinButton.onclick = async () => {
		if(roomNameInput.value === "") {
			formErrorText.textContent = "RoomNameを入力してください";
			return;
		};
		
		formErrorText.textContent = "";
		const videoId = mediaForm['videoMedia'].value;
		const audioId = mediaForm['audioMedia'].value;
		const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream({
			video: {
				deviceId: videoId,
			},
			audio: {
				deviceId: audioId,
			}
		});
		video.attach(localVideo);
		await localVideo.play();
		data.videoFlg = true;
		data.videoId = videoId;
		data.audioFlg = true;
		data.audioId = audioId;
		toggleVideoImg.src = "/img/on_video.png";
		toggleAudioImg.src = "/img/on_mic.png";
		
		// ルーム入室
		const context = await SkyWayContext.Create(token);
		const room = await SkyWayRoom.FindOrCreate(context, {
			type: "sfu",
			name: mediaForm['roomName'].value,
		});		
		const me = await room.join();
		myId.textContent = me.id;
		data.userId = mediaForm['userId'].value;
		data.memberId = me.id;
		data.roomId = room.id;
		data.roomName = room.name;
		
		await sendSkywayDetails(data);
		await setConnectionList(me.id, true, true);
		
		const currentVideo = await me.publish(video);
		const currentAudio = await me.publish(audio);
		const localStream = localVideo.srcObject;
		const audioElm = document.createElement("audio");
		audio.attach(audioElm);
		await audioElm.play();
		// observeMic(audio);
		startVoiceActivity(audio);
		
		// remoteメディア用HTML生成
		const subscribeAndAttach = async (publication) => {
			if(publication.publisher.id === me.id) return;
			
			const { stream } = await me.subscribe(publication.id);
			
			let newMedia;
			switch(stream.track.kind) {
				case "video":
					const mediaArea = document.createElement("div");
					mediaArea.id = `media-area-${publication.publisher.id}`;
					mediaArea.style.width = "240px";
					mediaArea.style.height = "160px";
					mediaArea.classList.add("bg-dark", "d-flex", "justify-content-center", "align-items-center", "position-relative");
					
					const offMicImg = document.createElement("img");
					offMicImg.src = "/img/off_mic.png";
					offMicImg.setAttribute("width", "40px");
					offMicImg.setAttribute("height", "40px");
					offMicImg.classList.add("position-absolute", "bottom-0", "end-0", "bg-secondary");
					offMicImg.style.display = "none";
					mediaArea.appendChild(offMicImg);
					
					const offVideoImg = document.createElement("img");
					offVideoImg.src = "/img/off_video.png";
					offVideoImg.setAttribute("width", "40px");
					offVideoImg.setAttribute("height", "40px");
					offVideoImg.style.display = "none";
					mediaArea.appendChild(offVideoImg);
					
					newMedia = document.createElement("video");
					newMedia.setAttribute("width", "240px");
					newMedia.setAttribute("height", "160px");
					newMedia.playsInline = true;
					newMedia.autoplay = true;
					newMedia.id = `media-${publication.id}`;
					
					stream.attach(newMedia);
					mediaArea.appendChild(newMedia);
					remoteMediaArea.appendChild(mediaArea);
					break;
				case "audio":
					newMedia = document.createElement("audio");
					newMedia.autoplay = true;
					newMedia.id = `media-${publication.id}`;
					stream.attach(newMedia);
					document.getElementById(`media-area-${publication.publisher.id}`).appendChild(newMedia);
					break;
				default:
					return;
			}	
		};
		
		// メディア無効化検知 - publication:{contentType:"video"|"audio", id:string}
		room.onPublicationDisabled.add(e => {
			if(e.publication.publisher.id === me.id) return;
			
			if(e.publication.contentType === "video") {
				document.getElementById(`media-${e.publication.id}`).style.display = "none";
				const offVideoImg = document.getElementById(`media-area-${e.publication.publisher.id}`).children[1];
				offVideoImg.style.display = "block";
				setConnectionList(e.publication.publisher.id, false, null);
			}
			if(e.publication.contentType === "audio") {
				const mediaArea = document.getElementById(`media-${e.publication.id}`).closest("div");
				mediaArea.firstChild.style.display = "block";
				setConnectionList(e.publication.publisher.id, null, false);
			}
		});
		
		// メディア有効化検知 - publication:{contentType:"video"|"audio", id:string}
		room.onPublicationEnabled.add(e => {
			if(e.publication.publisher.id === me.id) return;
			
			if(e.publication.contentType === "video") {
				const offVideoImg = document.getElementById(`media-area-${e.publication.publisher.id}`).children[1];
				offVideoImg.style.display = "none";								
				document.getElementById(`media-${e.publication.id}`).style.display = "block";
				setConnectionList(e.publication.publisher.id, true, null);
			}
			if(e.publication.contentType === "audio") {
				const mediaArea = document.getElementById(`media-${e.publication.id}`).closest("div");
				mediaArea.firstChild.style.display = "none";
				setConnectionList(e.publication.publisher.id, null, true);
			}
		});
		
		room.publications.forEach(subscribeAndAttach);
		
		// 相手stream送信検知時
		room.onStreamPublished.add(async e => {
			subscribeAndAttach(e.publication);
		});
		
		// stream受信検知時
		room.onPublicationSubscribed.add(async e => {
			await setConnectionList(e.subscription.publication.publisher.id, true, true);
		});
		
		// ルーム退室時
		leaveButton.onclick = async () => {
			await me.leave();
			await room.dispose();
			data.videoFlg = false;
			data.audioFlg = false;
			
			myId.textContent = "";
			remoteMediaArea.replaceChildren();
			const tracks = localStream.getTracks();
			tracks.forEach(track => track.stop());
			localVideo.srcObject = null;
			toggleVideoImg.src = "/img/off_video.png";
			toggleAudioImg.src = "/img/off_mic.png";
			sendSkywayDetails(data);
			deleteConnectionList(me.id, null);
			location.reload();
		};
		
		// 相手ルーム退室検知時
		room.onStreamUnpublished.add(async e => {
			document.getElementById(`media-area-${e.publication.publisher.id}`)?.remove(); 
			await deleteConnectionList(null, e.publication.publisher.id);
		});
		
		// video ON/OFF
		toggleVideoImg.addEventListener("click", async () => {
			if(myId.textContent == "") return;
			
			if(data.videoFlg) {
				toggleVideoImg.src = "/img/off_video.png";
				currentVideo.disable();
				setConnectionList(me.id, false, null);
			} else {
				toggleVideoImg.src = "/img/on_video.png";
				currentVideo.enable();		
				setConnectionList(me.id, true, null);
			}
			data.videoFlg = !data.videoFlg;
			await sendSkywayDetails(data);
		});
		
		// mic ON/OFF
		toggleAudioImg.addEventListener("click", async () => {
			if(myId.textContent == "") return;
			if(data.audioFlg) {
				toggleAudioImg.src = "/img/off_mic.png";
				currentAudio.disable();
				setConnectionList(me.id, null, false);
			} else {
				toggleAudioImg.src = "/img/on_mic.png";
				currentAudio.enable();		
				setConnectionList(me.id, null, true);
			}
			data.audioFlg = !data.audioFlg;
			await sendSkywayDetails(data);
		});
		
		// 録画開始
		document.getElementById("start-record-btn").addEventListener("click", () => {
			if(data.videoFlg || data.audioFlg) startRecording(localStream, currentVideo, currentAudio);
		});
		
		// 録画停止
		document.getElementById("stop-record-btn").addEventListener("click", () => {
			currentVideo.disable();
			currentAudio.disable();
			setConnectionList(me.id, false, false);
			toggleVideoImg.src = "/img/off_video.png";
			toggleAudioImg.src = "/img/off_mic.png";
			data.videoFlg = false;
			data.audioFlg = false;
			
			stopRecording();
			document.getElementById("start-record-btn").classList.add("d-block");
			document.getElementById("start-record-btn").classList.remove("d-none");
			document.getElementById("stop-record-btn").classList.add("d-none");
			document.getElementById("stop-record-btn").classList.remove("d-block");
		});
		
		// ページ再読み込み検知
		window.addEventListener("beforeunload", async () => {
			data.videoFlg = false;
			data.audioFlg = false;
			await sendSkywayDetails(data);
		});
	};
})();

const sendSkywayDetails = async (data) => {
	const csrf = document.querySelector("meta[name^='_csrf']").content;
	await fetch("http://localhost:8080/api/insertConnect", {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			"X-CSRF-TOKEN": csrf,
			"Content-Type": "application/json",
		}
	})
	.then(res => res.json())
	.then(data => {
		if(data.status == 200) {
			console.log("sended details")
		} else {
			console.error(data.errMsg);
		}
	})
	.catch(err => console.error(err));
};